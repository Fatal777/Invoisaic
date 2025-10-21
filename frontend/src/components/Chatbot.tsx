import { useState } from 'react';
import { MessageCircle, X, Send, Mail, Phone, ExternalLink } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Chatbot() {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([
    { text: "Hi! I'm here to help. Ask me anything about Invoisaic!", isUser: false }
  ]);
  const [input, setInput] = useState('');

  const faqs = [
    {
      question: "What is Invoisaic?",
      answer: "Invoisaic is an AI-powered invoice automation platform that generates country-specific invoices in seconds using Amazon Bedrock Nova Micro."
    },
    {
      question: "Which countries are supported?",
      answer: "We support 5 countries: USA, Germany, India, UK, and France with automatic tax calculations and compliance."
    },
    {
      question: "How fast is invoice generation?",
      answer: "Invoices are generated in under 2 seconds with 98% accuracy. Bulk processing can handle 100+ invoices in 3 seconds!"
    },
    {
      question: "What AI features do you offer?",
      answer: "We offer 6 AI features: Invoice Generation, OCR Extraction, Smart Validation, Product Categorization, Reconciliation, and Bulk Processing."
    },
    {
      question: "How do I get started?",
      answer: "Try our live demo! Click on 'Live Demo' in the navigation to see Invoisaic in action."
    }
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = { text: input, isUser: true };
    setMessages(prev => [...prev, userMessage]);

    // Find matching FAQ
    const matchedFaq = faqs.find(faq => 
      input.toLowerCase().includes(faq.question.toLowerCase().split(' ')[1]) ||
      input.toLowerCase().includes('contact') ||
      input.toLowerCase().includes('email') ||
      input.toLowerCase().includes('phone')
    );

    // Generate response
    setTimeout(() => {
      let response = '';
      
      if (input.toLowerCase().includes('contact') || input.toLowerCase().includes('email') || input.toLowerCase().includes('phone')) {
        response = "You can reach us at:\n📧 Email: saadilkal.10@gmail.com\n📱 Phone: +91 8792204995";
      } else if (matchedFaq) {
        response = matchedFaq.answer;
      } else {
        response = "I'm not sure about that. Would you like to contact our team directly? Email us at saadilkal.10@gmail.com or call +91 8792204995.";
      }

      setMessages(prev => [...prev, { text: response, isUser: false }]);
    }, 500);

    setInput('');
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    handleSend();
  };

  return (
    <>
      {/* Chat Button - Bottom Right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white p-4 rounded-full shadow-2xl shadow-orange-500/50 transition-all hover:scale-110 group"
        aria-label="Open chat"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-24 right-6 z-50 w-[90vw] sm:w-96 rounded-2xl shadow-2xl border flex flex-col max-h-[600px] overflow-hidden transition-colors ${
          theme === 'dark'
            ? 'bg-zinc-950 border-zinc-800'
            : 'bg-white border-gray-200'
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">Invoisaic Support</h3>
                  <p className="text-xs text-[#FDDAD6]">We're here to help!</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-4 transition-colors ${
            theme === 'dark' ? 'bg-black' : 'bg-gray-50'
          }`}>
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.isUser
                      ? 'bg-orange-600 text-white rounded-br-sm'
                      : theme === 'dark'
                        ? 'bg-zinc-900 text-zinc-100 rounded-bl-sm shadow-sm border border-zinc-800'
                        : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                </div>
              </div>
            ))}

            {/* Quick Questions */}
            {messages.length === 1 && (
              <div className="space-y-2">
                <p className={`text-xs font-medium ${
                  theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'
                }`}>Quick questions:</p>
                {faqs.slice(0, 3).map((faq, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickQuestion(faq.question)}
                    className={`w-full text-left p-3 rounded-xl text-sm transition-colors border ${
                      theme === 'dark'
                        ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800 hover:border-orange-500'
                        : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {faq.question}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className={`px-4 py-3 border-t transition-colors ${
            theme === 'dark'
              ? 'bg-zinc-900 border-zinc-800'
              : 'bg-gray-100 border-gray-200'
          }`}>
            <p className={`text-xs font-medium mb-2 ${
              theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
            }`}>Contact Us:</p>
            <div className="space-y-1">
              <a
                href="mailto:saadilkal.10@gmail.com"
                className={`flex items-center gap-2 text-xs transition-colors ${
                  theme === 'dark'
                    ? 'text-zinc-300 hover:text-orange-500'
                    : 'text-gray-700 hover:text-orange-600'
                }`}
              >
                <Mail className="w-3 h-3" />
                saadilkal.10@gmail.com
              </a>
              <a
                href="tel:+918792204995"
                className={`flex items-center gap-2 text-xs transition-colors ${
                  theme === 'dark'
                    ? 'text-zinc-300 hover:text-orange-500'
                    : 'text-gray-700 hover:text-orange-600'
                }`}
              >
                <Phone className="w-3 h-3" />
                +91 8792204995
              </a>
            </div>
          </div>

          {/* Input */}
          <div className={`p-4 border-t transition-colors ${
            theme === 'dark'
              ? 'bg-zinc-950 border-zinc-800'
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className={`flex-1 px-4 py-2 border rounded-full focus:outline-none text-sm transition-colors ${
                  theme === 'dark'
                    ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500 focus:border-orange-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-orange-500'
                }`}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
