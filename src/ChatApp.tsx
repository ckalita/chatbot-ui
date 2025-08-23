import { useState, useRef, useEffect } from "react";
import { Share2, Download, Copy, FileText, FileType } from "lucide-react";
import jsPDF from "jspdf";

type Message = {
  role: "user" | "bot" | "image" | "audio" | "description";
  content: string;
};

export default function ChatApp() {
  //const [messages, setMessages] = useState<Message[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content:
        "👋 Welcome! I’m your AI Assistant, ready to support you with smart Q&A, image generation, visual content analysis, and speech-to-text or text-to-speech conversions. How can I assist you today?",
    },
  ]);


  const [input, setInput] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sessionId = "user123";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (role: Message["role"], content: string) => {
    setMessages((prev) => [...prev, { role, content }]);
  };

  const resetFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = async () => {
    console.log("sendMessage called, input:", input);
    if (!input.trim()) return;
    addMessage("user", input);
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/ai/RAG/chatBotUsingRag?question=${encodeURIComponent(input)}`,
        { method: "POST" }
      );
      const answer = await res.text();
      console.log("answer is : ", answer);
      addMessage("bot", answer);
    } catch (err) {
      console.error(err);
      addMessage("bot", "Error fetching response.");
    } finally {
      setInput("");
      setLoading(false);
    }
  };

  const generateImage = async () => {
    console.log("generateImage called, input:", input);
    if (!input.trim()) return;
    addMessage("user", input);
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/ai/image/getImage?question=${encodeURIComponent(input)}`
      );
      const blob = await res.blob();
      console.log("image blob size:", blob.size);
      const url = URL.createObjectURL(blob);
      addMessage("image", url);
    } catch (err) {
      console.error(err);
      addMessage("bot", "Error generating image.");
    } finally {
      setInput("");
      setLoading(false);
    }
  };

  const getImageDescription = async () => {
    console.log("getImageDescription called, input:");
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/ai/image/getImageDescription`, {
        method: "POST",
        body: formData,
      });
      const description = await res.text();
      console.log("description is : ", description);
      addMessage("description", description);
    } catch (err) {
      console.error(err);
      addMessage("bot", "Error describing image.");
    } finally {
      setFile(null);
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // reset input
      }
    }
  };

  const textToAudio = async () => {
    console.log("textToAudio called, input: ", input);
    if (!input.trim()) return;
    addMessage("user", input);
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/ai/speech/textToAudio?question=${encodeURIComponent(input)}`
      );
      const blob = await res.blob();
      console.log("audio blob size:", blob.size);
      const url = URL.createObjectURL(blob);
      addMessage("audio", url);
    } catch (err) {
      console.error(err);
      addMessage("bot", "Error generating audio.");
    } finally {
      setInput("");
      setLoading(false);
    }
  };

  const audioToText = async () => {
    console.log("audioToText called, input: ");
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/ai/speech/getAudioToText`, {
        method: "POST",
        body: formData,
      });
      const transcript = await res.text();
      console.log("transcript is : ", transcript);
      addMessage("bot", transcript);
    } catch (err) {
      console.error(err);
      addMessage("bot", "Error transcribing audio.");
    } finally {
      setFile(null);// reset state
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // reset input
      }
    }
  };

  // Copy to clipboard
  const handleCopyChat = () => {
    const chatText = messages
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n\n");

    navigator.clipboard.writeText(chatText).then(() => {
      alert("Chat copied to clipboard! ✅");
    });
  };

  // Share via Web Share API
    const handleShareChat = () => {
      const chatText = messages
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join("\n\n");

      if (navigator.share) {
        navigator.share({
          title: "Chat Conversation",
          text: chatText,
        });
      } else {
        handleCopyChat();
      }
    };

    // Download as text file
    const handleDownloadChat = () => {
      const chatText = messages
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join("\n\n");

      const blob = new Blob([chatText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "chat.txt";
      a.click();

      URL.revokeObjectURL(url);
    };

   // Download as .txt
   const handleDownloadTxt = () => {
     const chatText = messages
       .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
       .join("\n\n");

     const blob = new Blob([chatText], { type: "text/plain" });
     const url = URL.createObjectURL(blob);
     const a = document.createElement("a");
     a.href = url;
     a.download = "chat.txt";
     a.click();
     URL.revokeObjectURL(url);
   };

   // Download as .pdf
   const handleDownloadPdf = () => {
     const chatText = messages
       .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
       .join("\n\n");

     const doc = new jsPDF();
     const lineHeight = 10;
     const splitText = doc.splitTextToSize(chatText, 180); // Wrap text
     doc.text(splitText, 10, lineHeight);
     doc.save("chat.pdf");
   };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      {/* Header with app name and welcome message */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-blue-700">AI Multi-Modal Chat Assistant</h1>
        <p className="text-gray-600 mt-1">
          Welcome! I’m here to assist you with intelligent Q&A, AI-powered image generation, image content analysis, text-to-speech conversion, and audio transcription.
        </p>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 border rounded-lg">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "user" && (
              <div className="bg-blue-500 text-white p-3 rounded-2xl max-w-[80%] self-end ml-auto">
                {msg.content}
              </div>
            )}
            {msg.role === "bot" && (
              <div className="bg-gray-200 text-black p-3 rounded-2xl max-w-[80%] self-start mr-auto">
                {msg.content}
              </div>
            )}
            {msg.role === "image" && (
              <img src={msg.content} alt="AI generated" className="max-w-full rounded-lg" />
            )}
            {msg.role === "audio" && (
              <audio controls src={msg.content} className="max-w-full" />
            )}
            {msg.role === "description" && (
              <div className="bg-yellow-200 p-3 rounded-lg max-w-[80%]">{msg.content}</div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center space-x-1 bg-gray-200 text-black p-3 rounded-2xl max-w-[80%] self-start mr-auto">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></span>
          </div>
        )}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Share Buttons */}
      <div className="flex gap-3 mt-4">
          <div className="flex items-center justify-between p-2 border-b">
            <button
              onClick={handleCopyChat}
              className="p-2 rounded-full hover:bg-gray-200"
              title="Copy Chat"
            >
              <Copy className="w-5 h-5" />
            </button>
            <button
              onClick={handleShareChat}
              className="p-2 rounded-full hover:bg-gray-200"
              title="Share Chat"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowDownloadOptions((prev) => !prev)}
                className="p-2 rounded-full hover:bg-gray-200"
                title="Download Chat"
              >
                <Download className="w-5 h-5" />
              </button>

              {showDownloadOptions && (
                <div className="absolute right-0 mt-2 w-32 bg-white border rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => {
                      handleDownloadTxt();
                      setShowDownloadOptions(false);
                    }}
                    className="flex items-center w-full px-3 py-2 hover:bg-gray-100"
                  >
                    <FileText className="w-4 h-4 mr-2" /> Text
                  </button>
                  <button
                    onClick={() => {
                      handleDownloadPdf();
                      setShowDownloadOptions(false);
                    }}
                    className="flex items-center w-full px-3 py-2 hover:bg-gray-100"
                  >
                    <FileType className="w-4 h-4 mr-2" /> PDF
                  </button>
                </div>
              )}
            </div>

          </div>
      </div>

      {/* Input and file upload */}
      <div className="flex flex-col mt-3 space-y-2">
        <input
          className="flex-1 border rounded-lg p-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <div className="flex space-x-2">
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
            disabled={loading}
          >
            {loading ? "..." : "Q&A"}
          </button>
          <button
            onClick={generateImage}
            className="bg-green-500 text-white px-4 py-2 rounded-lg"
            disabled={loading}
          >
            {loading ? "..." : "Generate Image"}
          </button>
          <button
            onClick={textToAudio}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg"
            disabled={loading}
          >
            {loading ? "..." : "Text to Audio"}
          </button>
        </div>
        <div className="flex flex-col space-y-2 mt-3">
          <div className="flex items-center space-x-3">
            {/* Custom file input */}
            <label className="flex-1 cursor-pointer">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 border rounded-lg p-2 text-center">
                {file ? file.name : "Choose File"}
              </div>
            </label>

            {/* Image Description button */}
            <button
              onClick={getImageDescription}
              disabled={!file}
              className={`px-4 py-2 rounded-lg ${
                file ? "bg-yellow-500 text-black hover:bg-yellow-600" : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {loading ? "..." : "Image Description"}
            </button>

            {/* Audio to Text button */}
            <button
              onClick={audioToText}
              disabled={!file}
              className={`px-4 py-2 rounded-lg ${
                file ? "bg-pink-500 text-white hover:bg-pink-600" : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {loading ? "..." : "Audio to Text"}
            </button>
          </div>

          {/* Optional validation message */}
          {!file && (
            <p className="text-red-500 text-sm mt-1">
              Please upload a file to enable Image Description / Audio to Text.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
