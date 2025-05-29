// components/MessageInput.jsx
import { useState } from 'react';
import { FiSend, FiPaperclip } from 'react-icons/fi';
import { rtdb } from '../utils/firebaseClient'; // Adjust path
import { ref, push, serverTimestamp, update } from 'firebase/database';
import Button from './Button'; // Assuming you have a Button component

const MessageInput = ({ chatId, currentUserId, otherUserIds = [] }) => { // otherUserIds for updating their userChats
    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const text = messageText.trim();
        if (!text || !chatId || !currentUserId) return;

        setIsSending(true);

        const messagesRef = ref(rtdb, `chats/${chatId}/messages`);
        const newMessageRef = push(messagesRef); // Generate unique ID for new message

        const messageData = {
            senderUid: currentUserId,
            text: text,
            timestamp: serverTimestamp(), // Use RTDB server timestamp
            type: 'text', // Default to text
        };

        const lastMessageSnippet = text.length > 50 ? text.substring(0, 47) + "..." : text;

        // Prepare multi-path update
        const updates = {};
        updates[`chats/${chatId}/messages/${newMessageRef.key}`] = messageData;
        updates[`chats/${chatId}/metadata/lastMessageTimestamp`] = serverTimestamp();
        updates[`chats/${chatId}/metadata/lastMessageSnippet`] = lastMessageSnippet;
        updates[`chats/${chatId}/metadata/lastMessageSenderUid`] = currentUserId;


        // Update userChats index for the current user
        updates[`users/${currentUserId}/userChats/${chatId}/lastMessageTimestamp`] = serverTimestamp();
        updates[`users/${currentUserId}/userChats/${chatId}/lastMessageSnippet`] = lastMessageSnippet;
        updates[`users/${currentUserId}/userChats/${chatId}/lastMessageSenderUid`] = currentUserId;
        // updates[`users/${currentUserId}/userChats/${chatId}/isRead`] = true; // Current user has "read" their own message

        // Update userChats index for other participants
        // Ensure otherUserIds is an array and doesn't include currentUserId
        const uniqueOtherUserIds = [...new Set(otherUserIds.filter(id => id !== currentUserId))];

        uniqueOtherUserIds.forEach(uid => {
            updates[`users/${uid}/userChats/${chatId}/lastMessageTimestamp`] = serverTimestamp();
            updates[`users/${uid}/userChats/${chatId}/lastMessageSnippet`] = lastMessageSnippet;
            updates[`users/${uid}/userChats/${chatId}/lastMessageSenderUid`] = currentUserId;
            // Optionally manage unread counts here:
            // updates[`users/${uid}/userChats/${chatId}/unreadCount`] = increment(1); // Requires Cloud Function or careful client logic
        });

        try {
            await update(ref(rtdb), updates); // Perform atomic multi-path update
            setMessageText(''); // Clear input after sending
        } catch (error) {
            console.error('Error sending message:', error);
            // Handle error (e.g., show a notification)
        } finally {
            setIsSending(false);
        }
    };

    return (
        <form
            onSubmit={handleSendMessage}
            className="p-3 sm:p-4 border-t border-nova-gray-200 bg-white dark:bg-nova-gray-800 flex items-center gap-2 sm:gap-3"
        >
            {/* Placeholder for attachment button */}
            {/* <Button type="button" variant="icon" className="text-nova-gray-500 hover:text-nova-blue-500">
                <FiPaperclip size={20} />
            </Button> */}
            <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                rows="1"
                className="flex-grow p-2.5 text-sm text-nova-gray-900 bg-nova-gray-50 rounded-lg border border-nova-gray-300 focus:ring-nova-blue-500 focus:border-nova-blue-500 dark:bg-nova-gray-700 dark:border-nova-gray-600 dark:placeholder-nova-gray-400 dark:text-white dark:focus:ring-nova-blue-500 dark:focus:border-nova-blue-500 resize-none"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                    }
                }}
                disabled={isSending}
            />
            <Button
                type="submit"
                variant="primary"
                className="!p-2.5 sm:!p-3 !rounded-lg"
                disabled={isSending || messageText.trim() === ''}
                isLoading={isSending} // Assuming Button component handles isLoading prop
            >
                <FiSend size={18} />
                <span className="sr-only">Send message</span>
            </Button>
        </form>
    );
};

export default MessageInput;