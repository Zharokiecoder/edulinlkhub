"use client"

import React, { useState, useEffect, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Search, Send, Paperclip, MoreVertical, Phone, Video, ImageIcon, Smile, Check, CheckCheck } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

interface Participant {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
}

interface Conversation {
  id: string;
  participant: Participant;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export default function StudentMessagesPage() {
  const searchParams = useSearchParams();
  const instructorIdFromUrl = searchParams?.get('instructorId');
  
  const supabase = getSupabaseClient(); // ✅ Use shared client
  
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    if (currentUserId && instructorIdFromUrl) {
      handleMessageInstructor(instructorIdFromUrl);
    }
  }, [currentUserId, instructorIdFromUrl]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to real-time messages for ALL conversations
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('all-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload: any) => {
          const newMessage = payload.new as Message;
          
          // Only add message if user is sender or receiver
          if (newMessage.sender_id === currentUserId || newMessage.receiver_id === currentUserId) {
            // Update messages if it's for the selected conversation
            if (selectedConversation && newMessage.conversation_id === selectedConversation.id) {
              setMessages(prev => {
                // Avoid duplicates
                if (prev.find(m => m.id === newMessage.id)) return prev;
                return [...prev, newMessage];
              });
              
              // Mark as read if we're the receiver
              if (newMessage.receiver_id === currentUserId) {
                markMessageAsRead(newMessage.id);
              }
            }
            
            // Refresh conversations to update last message
            fetchConversations(currentUserId);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload: any) => {
          const updatedMessage = payload.new as Message;
          
          if (selectedConversation && updatedMessage.conversation_id === selectedConversation.id) {
            setMessages(prev => 
              prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    try {
      // ✅ Use getSession() instead of getUser()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('No session in messages page:', sessionError);
        setLoading(false);
        return;
      }

      setCurrentUserId(session.user.id);
      await fetchConversations(session.user.id);
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageInstructor = async (instructorId: string) => {
    try {
      // Check if conversation exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(participant_1_id.eq.${currentUserId},participant_2_id.eq.${instructorId}),and(participant_1_id.eq.${instructorId},participant_2_id.eq.${currentUserId})`)
        .single();

      if (existingConv) {
        // Conversation exists, select it
        await fetchConversations(currentUserId);
        const conv = conversations.find(c => c.id === existingConv.id);
        if (conv) setSelectedConversation(conv);
      } else {
        // Create new conversation
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            participant_1_id: currentUserId,
            participant_2_id: instructorId,
          })
          .select()
          .single();

        if (error) throw error;

        // Refresh conversations
        await fetchConversations(currentUserId);
      }
    } catch (error) {
      console.error('Error handling instructor message:', error);
    }
  };

  const fetchConversations = async (userId: string) => {
    try {
      const { data: convs, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participant_1:participant_1_id(id, name, email, avatar_url, role),
          participant_2:participant_2_id(id, name, email, avatar_url, role)
        `)
        .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      if (convs && convs.length > 0) {
        const formattedConvs = await Promise.all(convs.map(async (conv: any) => {
          const otherParticipant = conv.participant_1.id === userId 
            ? conv.participant_2 
            : conv.participant_1;

          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('receiver_id', userId)
            .eq('read', false);

          return {
            id: conv.id,
            participant: otherParticipant,
            lastMessage: conv.last_message || 'Start a conversation',
            lastMessageAt: conv.last_message_at,
            unread: count || 0,
          };
        }));

        setConversations(formattedConvs);
        
        if (formattedConvs.length > 0 && !selectedConversation) {
          setSelectedConversation(formattedConvs[0]);
        }
      } else {
        await createInitialConversations(userId);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const createInitialConversations = async (userId: string) => {
    try {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('courses:course_id(instructor_id, instructors:instructor_id(id, name, email, avatar_url))')
        .eq('student_id', userId);

      if (enrollments && enrollments.length > 0) {
        const instructorIds = new Set<string>();
        enrollments.forEach((e: any) => {
          if (e.courses?.instructors?.id) {
            instructorIds.add(e.courses.instructors.id);
          }
        });

        for (let instructorId of instructorIds) {
          await createConversation(userId, instructorId);
        }

        await fetchConversations(userId);
      }
    } catch (error) {
      console.error('Error creating initial conversations:', error);
    }
  };

  const createConversation = async (user1Id: string, user2Id: string) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          participant_1_id: user1Id,
          participant_2_id: user2Id,
        })
        .select()
        .single();

      if (error && error.code !== '23505') throw error;
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', currentUserId)
        .eq('read', false);

      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, unread: 0 } : conv
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: selectedConversation.id,
      sender_id: currentUserId,
      receiver_id: selectedConversation.participant.id,
      content: messageInput.trim(),
      read: false,
      created_at: new Date().toISOString(),
    };

    // Optimistically add message to UI
    setMessages(prev => [...prev, tempMessage]);
    setMessageInput('');

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: currentUserId,
          receiver_id: selectedConversation.participant.id,
          content: tempMessage.content,
          read: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temp message with real one
      setMessages(prev => 
        prev.map(msg => msg.id === tempMessage.id ? data : msg)
      );

      // Update conversation
      await supabase
        .from('conversations')
        .update({
          last_message: tempMessage.content,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', selectedConversation.id);

      await fetchConversations(currentUserId);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      alert('Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>
        <div className="flex flex-col sm:flex-row h-full">
          <div className={`${selectedConversation ? 'hidden sm:flex' : 'flex'} sm:w-80 w-full border-r border-gray-200 flex-col`}>
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                      selectedConversation?.id === conv.id
                        ? 'bg-cyan-50 border-l-4 border-l-cyan-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        {conv.participant.avatar_url ? (
                          <Image src={conv.participant.avatar_url} alt={conv.participant.name} width={48} height={48} className="rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {conv.participant.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 truncate">{conv.participant.name}</h4>
                          <span className="text-xs text-gray-500">
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                        {conv.unread > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-cyan-600 text-white text-xs font-medium rounded-full mt-1">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  {searchQuery ? 'No conversations found' : 'No messages yet'}
                </div>
              )}
            </div>
          </div>

          {selectedConversation ? (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSelectedConversation(null)}
                      className="sm:hidden p-2 hover:bg-gray-100 rounded-lg"
                    >
                      ←
                    </button>
                    <div className="relative">
                      {selectedConversation.participant.avatar_url ? (
                        <Image src={selectedConversation.participant.avatar_url} alt={selectedConversation.participant.name} width={40} height={40} className="rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold">
                          {selectedConversation.participant.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedConversation.participant.name}</h3>
                      <p className="text-xs text-gray-500">{selectedConversation.participant.role === 'educator' ? 'Instructor' : 'Student'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Phone size={20} className="text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Video size={20} className="text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical size={20} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-md px-4 py-3 rounded-2xl ${
                        message.sender_id === currentUserId
                          ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}>
                        <p className="text-sm break-words">{message.content}</p>
                        <div className={`flex items-center justify-end gap-1 text-xs mt-1 ${
                          message.sender_id === currentUserId ? 'text-cyan-100' : 'text-gray-500'
                        }`}>
                          <span>{formatTime(message.created_at)}</span>
                          {message.sender_id === currentUserId && (
                            message.read ? <CheckCheck size={14} /> : <Check size={14} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-end gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                    <Paperclip size={20} className="text-gray-600" />
                  </button>
                  <button className="hidden sm:block p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                    <ImageIcon size={20} className="text-gray-600" />
                  </button>
                  <button className="hidden sm:block p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                    <Smile size={20} className="text-gray-600" />
                  </button>
                  <div className="flex-1">
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      rows={1}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex flex-1 items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send size={40} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No conversation selected</h3>
                <p className="text-gray-600">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}