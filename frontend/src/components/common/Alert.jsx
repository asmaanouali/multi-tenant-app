const Alert = ({ type = 'info', message, onClose }) => {
  const typeStyles = {
    success: 'bg-green-50 border-green-500 text-green-800',
    error: 'bg-red-50 border-red-500 text-red-800',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
    info: 'bg-blue-50 border-blue-500 text-blue-800',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  if (!message) return null;

  return (
    <div className={`border-l-4 p-4 rounded-lg ${typeStyles[type]} mb-4`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-xl">{icons[type]}</span>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 hover:bg-white hover:bg-opacity-20"
          >
            <span className="sr-only">Close</span>
            <span className="text-xl">×</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;