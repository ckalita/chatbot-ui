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


  const [response, setResponse] = useState("");
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


  //code for ChatGPT-style typing effect
  const simulateTyping = (text: string) => {
    let i = 0;
    const typingMessage: Message = { role: "bot", content: "" };

    setMessages((prev) => [...prev, typingMessage]);

    const interval = setInterval(() => {
      i++;
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = {
          ...updated[lastIndex],
          content: text.slice(0, i),
        };
        return updated;
      });

      if (i >= text.length) {
        clearInterval(interval);
      }
    }, 25); // typing speed (25ms per character)
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
    setInput("");
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/ai/RAG/chatBotUsingRag?question=${encodeURIComponent(input)}`,
        { method: "POST" }
      );
      const answer = await res.text();
      console.log("answer is : ", answer);
      //addMessage("bot", answer);
      simulateTyping(answer);
    } catch (err) {
      console.error(err);
      //addMessage("bot", "Error fetching response.");
      simulateTyping("Error fetching response.");
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
    setInput("");

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
      simulateTyping("Error generating image.");
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

    // 👉 Show the uploaded image in chat
    const fileUrl = URL.createObjectURL(file);
    addMessage("image", fileUrl);
    //addMessage("user", fileUrl, "image");

    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/ai/image/getImageDescription`, {
        method: "POST",
        body: formData,
      });
      const description = await res.text();
      console.log("description is : ", description);
      //addMessage("description", description);
      simulateTyping(description);
    } catch (err) {
      console.error(err);
      simulateTyping("Error describing image.");//addMessage("bot", "Error describing image.");
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
    setInput("");

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/ai/speech/textToAudio?question=${encodeURIComponent(input)}`
      );
      const blob = await res.blob();
      console.log("audio blob size:", blob.size);
      const url = URL.createObjectURL(blob);
      addMessage("audio", url);
      //addMessage("bot", fileUrl, "audio");
    } catch (err) {
      console.error(err);
      simulateTyping("Error describing image.");//addMessage("bot", "Error generating audio.");
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

    // 👉 Show the uploaded audio in chat
    const fileUrl = URL.createObjectURL(file);
    addMessage("audio", fileUrl);
    //addMessage("user", fileUrl, "audio");

    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/ai/speech/getAudioToText`, {
        method: "POST",
        body: formData,
      });
      const transcript = await res.text();
      console.log("transcript is : ", transcript);
      //addMessage("bot", transcript);
      simulateTyping(transcript);
    } catch (err) {
      console.error(err);
      simulateTyping( "Error transcribing audio.");//addMessage("bot", "Error transcribing audio.");
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

  // Document upload for user
  // New state for document uploads
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  // Document upload for user
  const uploadDocument = async () => {
    if (!docFile) {
      setStatus("⚠️ Please select a document first!");
      return;
    }
    setUploading(true);

    const formData = new FormData();
    formData.append("file", docFile);

    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/ai/uploadDocument`, {
        method: "POST",
        body: formData,
      });
      const msg = await res.text();
      setStatus("📂 " + msg);

      // Add file to uploaded list
      setUploadedFiles((prev) => [...prev, docFile.name]);
    } catch (err) {
      console.error(err);
      setStatus("❌ Error uploading document.");
    } finally {
      setDocFile(null);
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // reset file input
      }
    }
  };

  return (
      <div className="flex flex-col md:flex-row h-screen">
        {/* Left: Chat section */}
        <div className="flex-1 md:w-2/3 p-2 sm:p-3 md:p-4 border-r overflow-y-auto">
          <div className="flex flex-col h-full max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-3 sm:mb-4">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-700">
                AI Multi-Modal Chat Assistant
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">
                Welcome! I’m here to assist you with intelligent Q&A, AI-powered image generation, image content analysis, text-to-speech conversion, and audio transcription.
              </p>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 border rounded-lg">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "user" && (
                    <div className="bg-blue-500 text-white p-2 sm:p-3 rounded-2xl max-w-[80%] text-sm sm:text-base">
                      {msg.content}
                    </div>
                  )}
                  {msg.role === "bot" && (
                    <div className="bg-gray-200 text-black p-2 sm:p-3 rounded-2xl max-w-[80%] text-sm sm:text-base">
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
                    <div className="g-gray-200 text-black p-2 sm:p-3 rounded-2xl max-w-[80%] text-sm sm:text-base">
                      {msg.content}
                    </div>
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
            <div className="mt-2 sm:mt-3">
              <div className="flex justify-end gap-2 sm:gap-3">
                {/* Copy */}
                <button
                  onClick={handleCopyChat}
                  className="p-1.5 sm:p-2 rounded-full hover:bg-gray-200 active:scale-95 transition"
                  title="Copy Chat"
                >
                  <Copy className="w-5 h-5 sm:w-4 sm:h-4 text-gray-600" />
                </button>

                {/* Share */}
                <button
                  onClick={handleShareChat}
                  className="p-1.5 sm:p-2 rounded-full hover:bg-gray-200 active:scale-95 transition"
                  title="Share Chat"
                >
                  <Share2 className="w-5 h-5 sm:w-4 sm:h-4 text-gray-600" />
                </button>

                {/* Download dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowDownloadOptions((prev) => !prev)}
                    className="p-1.5 sm:p-2 rounded-full hover:bg-gray-200 active:scale-95 transition"
                    title="Download Chat"
                  >
                    <Download className="w-5 h-5 sm:w-4 sm:h-4 text-gray-600" />
                  </button>

                  {showDownloadOptions && (
                    <div className="absolute right-0 mt-2 w-32 bg-white border rounded-md shadow-md z-10">
                      <button
                        onClick={() => {
                          handleDownloadTxt();
                          setShowDownloadOptions(false);
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100"
                      >
                        <FileText className="w-4 h-4 mr-2" /> Text
                      </button>
                      <button
                        onClick={() => {
                          handleDownloadPdf();
                          setShowDownloadOptions(false);
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100"
                      >
                        <FileType className="w-4 h-4 mr-2" /> PDF
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>



            {/* Input + buttons */}
            <div className="flex flex-col mt-2 sm:mt-3 space-y-2">
              <input
                className="flex-1 border rounded-lg p-2 sm:p-3 text-sm sm:text-base"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              {/* Toolbar with all 6 buttons + file input */}
              <div className="flex flex-row flex-nowrap items-center gap-2 mt-3 w-full overflow-x-auto p-2 bg-gray-50 rounded-lg shadow">

                {/* Q&A */}
                <button
                  onClick={sendMessage}
                  className="flex-shrink-0 bg-blue-500 text-white px-3 py-2 text-xs rounded-md hover:bg-blue-600 active:scale-95"
                  disabled={loading}
                >
                  {loading ? "..." : "Q&A"}
                </button>

                {/* Generate Image */}
                <button
                  onClick={generateImage}
                  className="flex-shrink-0 bg-green-500 text-white px-3 py-2 text-xs rounded-md hover:bg-green-600 active:scale-95"
                  disabled={loading}
                >
                  {loading ? "..." : "Generate Image"}
                </button>

                {/* Text → Audio */}
                <button
                  onClick={textToAudio}
                  className="flex-shrink-0 bg-purple-500 text-white px-3 py-2 text-xs rounded-md hover:bg-purple-600 active:scale-95"
                  disabled={loading}
                >
                  {loading ? "..." : "Text → Audio"}
                </button>

                {/* File input */}
                <label className="flex-shrink-0 cursor-pointer min-w-[120px]">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md px-3 py-2 text-xs text-center truncate">
                    {file ? file.name : "Choose File"}
                  </div>
                </label>

                {/* Image Description */}
                <button
                  onClick={getImageDescription}
                  disabled={!file}
                  className={`flex-shrink-0 px-3 py-2 text-xs rounded-md font-medium transition ${
                    file
                      ? "bg-yellow-500 text-black hover:bg-yellow-600 active:scale-95"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {loading ? "..." : "Image Describe"}
                </button>

                {/* Audio → Text */}
                <button
                  onClick={audioToText}
                  disabled={!file}
                  className={`flex-shrink-0 px-3 py-2 text-xs rounded-md font-medium transition ${
                    file
                      ? "bg-pink-500 text-white hover:bg-pink-600 active:scale-95"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {loading ? "..." : "Audio → Text"}
                </button>

              </div>


                {/* Optional validation message */}
                {!file && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">
                    Please upload a file to enable Image Description and Audio → Text feature.
                  </p>
                )}
              </div>
          </div>
        </div>

        {/* Right: File upload section */}
        <div className="flex-none md:w-1/3 max-h-[35vh] md:max-h-none p-3 sm:p-4 md:p-6 bg-gray-50 border-l overflow-y-auto">
          <h2 className="text-lg sm:text-xl font-bold mb-3">📂 Upload Your Documents</h2>
          <p className="text-xs sm:text-sm md:text-base text-gray-700 mb-3 leading-relaxed">
            <strong>Enhance your AI Assistant by uploading your own files!</strong>
                        <br /><br />
                        ✅ Supported formats: <span className="font-medium">PDF, TXT, DOCX, HTML</span>
                        <br /><br />
                        🤖 After upload, the chatbot can use your document’s knowledge to provide more relevant and personalized answers.
                        <br /><br />
                        💡 <span className="italic">Example:</span> Upload a research paper, company policy, or notes — then ask the assistant:
                        <br />
                        <span className="text-blue-600">“Summarize the key points from my file”</span><br />
                        <span className="text-blue-600">“What does Section 2 of the uploaded doc say about eligibility?”</span>

          </p>

          <input
            type="file"
            onChange={(e) => setDocFile(e.target.files?.[0] || null)}
            className="mb-2 block w-full text-xs sm:text-sm text-gray-700"
          />

          <button
            onClick={uploadDocument}
            disabled={!docFile || uploading}
            className="w-full px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base
            bg-indigo-500 text-white hover:bg-indigo-600 disabled:bg-gray-300 disabled:text-gray-500"
          >
            {uploading ? "Uploading..." : "Upload Document"}
          </button>
          {status && <p className="mt-2 text-sm text-gray-600">{status}</p>}

                    {/* List of uploaded docs */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold">Uploaded Files</h3>
                        <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                          {uploadedFiles.map((name, i) => (
                            <li key={i}>{name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
        </div>
      </div>
    );
}
