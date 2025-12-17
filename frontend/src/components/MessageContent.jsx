const MessageContent = ({ content }) => {
  // Simple renderer that preserves newlines and spacing
  return (
    <div className="whitespace-pre-wrap leading-relaxed break-words text-gray-100">
      {content}
    </div>
  );
};

export default MessageContent;