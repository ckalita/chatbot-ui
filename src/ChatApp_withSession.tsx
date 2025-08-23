import { useState } from "react";

type Message = {
  role: "user" | "bot" | "image" | "audio" | "description";
  content: string;
};

export default function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  const sessionId = "user123";

  // 1. Send question to RAG endpoint
  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: input }]);

    try {
      const res = await fetch(
        `http://localhost:9090/RAG/chatBotUsingRag?question=${encodeURIComponent(
          input
        )}`,
        { method: "POST" }
      );
      const answer = await res.text();
      setMessages((prev) => [...prev, { role: "bot", content: answer }]);
    } catch (err) {
      console.error(err);
    } finally {
      setInput("");
    }
  };

  // 2. Generate image from text input
  const generateImage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: input }]);

    try {
      const res = await fetch(
        `http://localhost:9090/image/getImage?question=${encodeURIComponent(
          input
        )}`
      );

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setMessages((prev) => [...prev, { role: "image", content: url }]);
    } catch (err) {
      console.error(err);
    } finally {
      setInput("");
    }
  };

  // 3. Get description of uploaded image
  const getImageDescription = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:9090/image/getImageDescription", {
        method: "POST",
        body: formData,
      });

      const description = await res.text();
      setMessages((prev) => [...prev, { role: "description", content: description }]);
    } catch (err) {
      console.error(err);
    } finally {
      setFile(null);
    }
  };

  // 4. Convert text input to audio (TTS)
  const textToAudio = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: input }]);

    try {
      const res = await fetch(
        `http://localhost:9090/speech/textToAudio?question=${encodeURIComponent(
          input
        )}`
      );
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setMessages((prev) => [...prev, { role: "audio", content: url }]);
    } catch (err) {
      console.error(err);
    } finally {
      setInput("");
    }
  };

  // 5. Convert uploaded audio file to text (STT)
  const audioToText = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:9090/speech/getAudioToText", {
        method: "POST",
        body: formData,
      });

      const transcript = await res.text();
      setMessages((prev) => [...prev, { role: "bot", content: transcript }]);
    } catch (err) {
      console.error(err);
    } finally {
      setFile(null);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 border rounded-lg">
        {messages.map((msg, i) => (
          <div key={i}>
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
      </div>

      {/* Input and file upload */}
      <div className="flex flex-col mt-3 space-y-2">
        <input
          className="flex-1 border rounded-lg p-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <div className="flex space-x-2">
          <button onClick={sendMessage} className="bg-blue-500 text-white px-4 py-2 rounded-lg">
            Send Q&A
          </button>
          <button onClick={generateImage} className="bg-green-500 text-white px-4 py-2 rounded-lg">
            Generate Image
          </button>
          <button onClick={textToAudio} className="bg-purple-500 text-white px-4 py-2 rounded-lg">
            Text to Audio
          </button>
        </div>
        <div className="flex space-x-2 items-center">
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button onClick={getImageDescription} className="bg-yellow-500 text-black px-4 py-2 rounded-lg">
            Image Description
          </button>
          <button onClick={audioToText} className="bg-pink-500 text-white px-4 py-2 rounded-lg">
            Audio to Text
          </button>
        </div>
      </div>
    </div>
  );
}
