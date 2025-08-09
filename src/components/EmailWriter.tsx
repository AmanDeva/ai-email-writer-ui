import React, { useState } from 'react';
import { Send, Wand2, Mail, User, Edit3, Clock, CheckCircle, AlertCircle, Copy, Trash2 } from 'lucide-react';

interface GeneratedEmail {
  subject: string;
  content: string;
}

interface EmailHistory {
  id: string;
  prompt: string;
  email: GeneratedEmail;
  timestamp: Date;
  sent: boolean;
}

const EmailWriter: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
  const [recipients, setRecipients] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  const [editableSubject, setEditableSubject] = useState('');
  const [editableContent, setEditableContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const API_BASE_URL = 'https://email-sender-api-xv42.onrender.com';

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const generateEmail = async () => {
    if (!prompt.trim()) {
      showMessage('error', 'Please enter a prompt to generate email content');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/generate-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate email');
      }

      const data = await response.json();
      
      // Parse the structured email content
      const emailContent = data.email;
      
      // Extract the first complete email example (most relevant one)
      let subject = 'Generated Email';
      let content = emailContent;
      
      // Look for the first subject line
      const subjectMatch = emailContent.match(/Subject:\s*(.+?)(?:\n|$)/i);
      if (subjectMatch) {
        subject = subjectMatch[1].trim();
        
        // Find the content after the first subject line
        const subjectIndex = emailContent.indexOf(subjectMatch[0]);
        const afterSubject = emailContent.substring(subjectIndex + subjectMatch[0].length);
        
        // Look for the next "Subject:" or "Here's" to find where this email ends
        const nextSectionMatch = afterSubject.match(/(?:\n\s*(?:Subject:|Here's|And here's))/i);
        
        if (nextSectionMatch) {
          // Extract content until the next section
          content = afterSubject.substring(0, nextSectionMatch.index).trim();
        } else {
          // Use all remaining content
          content = afterSubject.trim();
        }
      }
      
      // Clean up the content - remove extra whitespace and format nicely
      content = content.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
      
      const email: GeneratedEmail = {
        subject,
        content,
      };

      setGeneratedEmail(email);
      setEditableSubject(subject);
      setEditableContent(content);
      setIsEditing(false);

      // Add to history
      const historyItem: EmailHistory = {
        id: Date.now().toString(),
        prompt,
        email,
        timestamp: new Date(),
        sent: false,
      };
      setEmailHistory(prev => [historyItem, ...prev]);

      showMessage('success', 'Email content generated successfully!');
    } catch (error) {
      showMessage('error', 'Failed to generate email content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendEmail = async () => {
    if (!generatedEmail) {
      showMessage('error', 'Please generate email content first');
      return;
    }

    if (!recipients.trim()) {
      showMessage('error', 'Please enter recipient email addresses');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients: recipients,
          subject: editableSubject,
          content: editableContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', 'Email sent successfully!');
        
        // Update history to mark as sent
        setEmailHistory(prev => 
          prev.map(item => 
            item.id === emailHistory[0]?.id ? { ...item, sent: true } : item
          )
        );

        // Clear form
        setRecipients('');
        setGeneratedEmail(null);
        setEditableSubject('');
        setEditableContent('');
        setIsEditing(false);
      } else {
        throw new Error(data.message || 'Failed to send email');
      }
    } catch (error) {
      showMessage('error', 'Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showMessage('success', 'Email content copied to clipboard!');
    } catch (error) {
      showMessage('error', 'Failed to copy to clipboard');
    }
  };

  const loadFromHistory = (historyItem: EmailHistory) => {
    setPrompt(historyItem.prompt);
    setGeneratedEmail(historyItem.email);
    setEditableSubject(historyItem.email.subject);
    setEditableContent(historyItem.email.content);
    setIsEditing(false);
  };

  const deleteFromHistory = (id: string) => {
    setEmailHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
            <Wand2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            AI Email Writer
          </h1>
        </div>
        <p className="text-gray-600 text-lg">Generate professional emails with AI and send them instantly</p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Email Generation Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prompt Input */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-blue-500" />
              Generate Email Content
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Write a formal email inviting team members to a meeting tomorrow at 3 PM"
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={4}
                />
              </div>
              <button
                onClick={generateEmail}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-all duration-200"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Generate Email
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Email Preview */}
          {generatedEmail && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-emerald-500" />
                  Generated Email
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-1"
                  >
                    <Edit3 className="h-3 w-3" />
                    {isEditing ? 'Preview' : 'Edit'}
                  </button>
                  <button
                    onClick={() => copyToClipboard(`Subject: ${isEditing ? editableSubject : generatedEmail.subject}\n\n${isEditing ? editableContent : generatedEmail.content}`)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <input
                        type="text"
                        value={editableSubject}
                        onChange={(e) => setEditableSubject(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                      <textarea
                        value={editableContent}
                        onChange={(e) => setEditableContent(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        rows={12}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        {editableSubject || generatedEmail.subject}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                      <div className="p-3 bg-gray-50 rounded-lg border whitespace-pre-wrap">
                        {editableContent || generatedEmail.content}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Send Email Section */}
          {generatedEmail && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Send className="h-5 w-5 text-orange-500" />
                Send Email
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipients (comma-separated email addresses)
                  </label>
                  <input
                    type="text"
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                    placeholder="example@email.com, another@email.com"
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <button
                  onClick={sendEmail}
                  disabled={isSending || !recipients.trim()}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-all duration-200"
                >
                  {isSending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Email History Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              Email History
            </h2>
            
            {emailHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No emails generated yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {emailHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-gray-800 text-sm line-clamp-2">
                        {item.email.subject}
                      </h4>
                      <div className="flex gap-1 flex-shrink-0">
                        {item.sent && (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        )}
                        <button
                          onClick={() => deleteFromHistory(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                      {item.prompt}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {item.timestamp.toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => loadFromHistory(item)}
                        className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                      >
                        Load
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailWriter;