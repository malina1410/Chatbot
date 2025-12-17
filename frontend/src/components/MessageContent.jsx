import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const MessageContent = ({ content, animate }) => {
  // If animate is true, start empty. Otherwise, show full content immediately.
  const [displayedContent, setDisplayedContent] = useState(animate ? "" : content);
  const [isTyping, setIsTyping] = useState(animate);

  useEffect(() => {
    // If we shouldn't animate (or content changed unexpectedly), just show full text
    if (!animate) {
      setDisplayedContent(content);
      setIsTyping(false);
      return;
    }

    // Reset for new animation
    setDisplayedContent("");
    setIsTyping(true);

    let currentIndex = 0;
    const typingSpeed = 10; // ms per character (adjust for speed)

    const intervalId = setInterval(() => {
      if (currentIndex < content.length) {
        setDisplayedContent((prev) => content.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(intervalId);
        setIsTyping(false);
      }
    }, typingSpeed);

    return () => clearInterval(intervalId);
  }, [content, animate]);

  return (
    <div className="prose prose-invert max-w-none text-sm sm:text-base leading-relaxed break-words">
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="relative group rounded-lg overflow-hidden my-4 shadow-lg border border-gray-700">
                <div className="bg-gray-800 px-4 py-1.5 flex justify-between items-center text-xs text-gray-400 border-b border-gray-700">
                  <span className="uppercase font-semibold tracking-wider">{match[1]}</span>
                </div>
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  className="!m-0 !bg-[#1e1e1e] !p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className="bg-gray-800 text-red-300 rounded px-1.5 py-0.5 text-sm font-mono border border-gray-700" {...props}>
                {children}
              </code>
            );
          },
          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1 marker:text-blue-500">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1 marker:text-blue-500">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-blue-400 border-b border-gray-700 pb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mb-3 text-blue-300">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-bold mb-2 text-blue-200">{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-1 my-4 bg-gray-800/50 rounded-r text-gray-300 italic">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              {children}
            </a>
          ),
        }}
      >
        {/* If typing, add a blinking cursor at the end */}
        {displayedContent + (isTyping ? "▍" : "")}
      </ReactMarkdown>
    </div>
  );
};

export default MessageContent;