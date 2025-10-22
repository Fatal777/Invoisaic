import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });
const textractClient = new TextractClient({ region: process.env.AWS_REGION || 'ap-south-1' });

// CORS Headers - Support multiple origins including production domain
const getAllowedOrigin = (requestOrigin?: string): string => {
  const allowedOrigins = [
    'https://invoisaic.xyz',
    'https://invoisaic.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  
  // Default to production domain
  return 'https://invoisaic.xyz';
};

const getCorsHeaders = (origin?: string) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(origin),
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent,Accept',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
});

// Helper function to create consistent API responses
const createResponse = (statusCode: number, body: any, origin?: string, additionalHeaders: Record<string, string> = {}): APIGatewayProxyResult => {
  const corsHeaders = getCorsHeaders(origin);
  const response = {
    statusCode,
    headers: {
      ...corsHeaders,
      ...additionalHeaders
    },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  };
  
  console.log('Response headers:', JSON.stringify(response.headers, null, 2));
  return response;
};

// Helper function to create error responses
const createErrorResponse = (statusCode: number, message: string, origin?: string, error?: any): APIGatewayProxyResult => {
  console.error(`Error ${statusCode}:`, message, error);
  console.error('Error details:', JSON.stringify({
    message: error?.message,
    code: error?.code,
    statusCode: error?.statusCode,
    name: error?.name
  }));
  return createResponse(statusCode, {
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { details: error?.message || error })
  }, origin);
};

// Helper function to parse form data
async function parseFormData(body: string, boundary: string) {
  const result: Record<string, any> = {};
  const parts = body.split(`--${boundary}`);
  
  for (const part of parts) {
    if (part.includes('Content-Disposition: form-data;')) {
      const headers = part.split('\r\n\r\n')[0];
      const content = part.split('\r\n\r\n').slice(1).join('\r\n\r\n').trim();
      
      // Parse Content-Disposition header
      const nameMatch = headers.match(/name="([^"]+)"/);
      if (nameMatch && content) {
        const key = nameMatch[1];
        
        // If this is a file upload, handle it specially
        const filenameMatch = headers.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          const filename = filenameMatch[1];
          const contentTypeMatch = headers.match(/Content-Type: ([^\r\n]+)/);
          const contentType = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream';
          
          result[key] = content;
          result['filename'] = filename;
          result['contentType'] = contentType;
        } else {
          // Regular form field
          result[key] = content;
        }
      }
    }
  }
  
  return result;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('📄 Textract Handler: Processing document...');
  console.log('Event headers:', JSON.stringify(event.headers));
  console.log('Event isBase64Encoded:', event.isBase64Encoded);
  console.log('Event httpMethod:', event.httpMethod);
  console.log('Event body length:', event.body?.length || 0);
  
  // Get origin from request
  const origin = event.headers?.origin || event.headers?.Origin;
  console.log('Request origin:', origin);
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    const corsHeaders = getCorsHeaders(origin);
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Length': '0'
      },
      body: ''
    };
  }

  try {
    let fileBuffer: Buffer;
    let fileExtension = 'pdf'; // default extension
    let contentType = 'application/pdf'; // default content type
    let fileName = `uploads/${uuidv4()}`; // We'll add extension later

    const bucketName = process.env.S3_DOCUMENTS_BUCKET;
    if (!bucketName) {
      return createErrorResponse(500, 'S3_DOCUMENTS_BUCKET environment variable is not set', origin);
    }

    // Handle form data
    contentType = event.headers?.['content-type'] || event.headers?.['Content-Type'] || '';
    console.log('Content-Type:', contentType);
    
    if (contentType.includes('multipart/form-data')) {
      try {
        console.log('Processing multipart form data...');
        const boundary = contentType.split('boundary=')[1]?.split(';')[0] || '';
        console.log('Boundary:', boundary);
        
        if (!boundary) {
          return createErrorResponse(400, 'No boundary found in Content-Type header', origin);
        }
        
        // API Gateway base64 encodes binary data
        const bodyContent = event.isBase64Encoded ? 
          Buffer.from(event.body || '', 'base64').toString('binary') : 
          (event.body || '');
        
        console.log('Body content length:', bodyContent.length);
        
        const formData = await parseFormData(bodyContent, boundary);
        console.log('Form data keys:', Object.keys(formData));
        
        if (!formData.file) {
          return createErrorResponse(400, 'No file found in form data. Make sure to use form field name "file" for the file upload.', origin);
        }
        
        // The file content is already binary string, convert to buffer
        fileBuffer = Buffer.from(formData.file, 'binary');
        console.log('File buffer length:', fileBuffer.length);
        
        // Get file info from form data
        if (formData.filename) {
          const extMatch = formData.filename.match(/\.([a-zA-Z0-9]+)$/i);
          if (extMatch) {
            fileExtension = extMatch[1].toLowerCase();
            
            // Use the content type from the form data if available, otherwise determine from extension
            if (formData.contentType) {
              contentType = formData.contentType;
            } else {
              if (['jpg', 'jpeg'].includes(fileExtension)) {
                contentType = 'image/jpeg';
              } else if (fileExtension === 'png') {
                contentType = 'image/png';
              } else if (fileExtension === 'pdf') {
                contentType = 'application/pdf';
              }
            }
            
            // Generate a new filename with the correct extension
            fileName = `uploads/${uuidv4()}.${fileExtension}`;
            
            // Validate supported file types
            if (!['jpg', 'jpeg', 'png', 'pdf'].includes(fileExtension)) {
              return createErrorResponse(400, `Unsupported file type: ${fileExtension}. Supported types: PDF, JPG, PNG`, origin);
            }
          }
        }
      } catch (error) {
        console.error('Error parsing form data:', error);
        return createErrorResponse(400, 'Error parsing form data', origin, error);
      }
    } 
    // Handle direct file upload (base64)
    else if (event.body) {
      fileBuffer = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
      // For direct uploads, we'll assume PDF if no extension is provided
      fileName = `${fileName}.pdf`;
    } else {
      return createErrorResponse(400, 'No file data provided', origin);
    }

    // Upload file to S3
    console.log(`📄 Uploading file to S3: ${fileName} (${contentType})`);
    const uploadParams = {
      Bucket: bucketName,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType
    };

    await s3Client.send(new PutObjectCommand(uploadParams));
    
    // Process with Textract
    console.log(`🔍 Processing ${fileExtension.toUpperCase()} document with Textract...`);
    
    let extractedText = '';
    let blockCount = 0;

    if (['jpg', 'jpeg', 'png', 'pdf'].includes(fileExtension)) {
      // Use synchronous detection for images and single-page PDFs (up to 5MB)
      // This works perfectly for our generated invoice PDFs
      const textractParams = {
        Document: {
          Bytes: fileBuffer
        }
      };

      const textractCommand = new DetectDocumentTextCommand(textractParams);
      const textractResponse = await textractClient.send(textractCommand);

      // Extract text from Textract response
      extractedText = textractResponse.Blocks
        ?.filter(block => block.BlockType === 'LINE' && block.Text)
        .map(block => block.Text)
        .join('\n') || '';

      blockCount = textractResponse.Blocks?.length || 0;

      console.log(`✅ Extracted ${blockCount} blocks, ${extractedText.length} characters from ${fileExtension.toUpperCase()}`);
    } else {
      return createErrorResponse(400, `Unsupported file type: ${fileExtension}`, origin);
    }

    console.log(`✅ Textract processing complete. Extracted ${extractedText.length} characters.`);

    return createResponse(200, {
      success: true,
      text: extractedText,
      s3Key: fileName,
      blockCount: blockCount
    }, origin);

  } catch (error: any) {
    console.error('❌ Textract processing error:', error);
    console.error('Error stack:', error?.stack);
    return createErrorResponse(
      error.statusCode || 500,
      'Textract processing failed',
      origin,
      error
    );
  }
};
