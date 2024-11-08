import React, {useState, useEffect, useRef} from 'react';
import {ActivityIndicator, Alert, FlatList, Platform} from 'react-native';
import styled from 'styled-components/native';
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'assistant';
}

// Helper function to parse and style bold text
const renderTextWithBold = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/); // Split text by **...**

    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            const boldText = part.slice(2, -2); // Remove the ** markers
            return (
                <BoldText key={index}>{boldText}</BoldText>
            );
        }
        return <RegularText key={index}>{part}</RegularText>;
    });
};

const BoldText = styled.Text`
    font-weight: bold;
`;

const RegularText = styled.Text``;

const ChatScreen: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const [baseUrl, setBaseUrl] = useState('');
    const [modelName, setModelName] = useState('');

    useEffect(() => {
        // Load baseUrl and modelName from AsyncStorage when the component mounts
        const loadSettings = async () => {
            try {
                const savedBaseUrl = await AsyncStorage.getItem('@settings_baseUrl');
                const savedModelName = await AsyncStorage.getItem('@settings_modelName');
                if (savedBaseUrl) setBaseUrl(savedBaseUrl);
                if (savedModelName) setModelName(savedModelName);
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        };
        loadSettings();
    }, []);


    const sendMessage = async () => {
        if (inputText.trim() === '') return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputText('');
        setLoading(true);

        try {
            if (inputText.trim() === '' || !baseUrl || !modelName) {
                // Show an alert if settings are missing or input is empty
                Alert.alert('Error', 'Please enter a message and ensure settings are configured.');
                return;
            }

            const response = await fetch(`${baseUrl}/v1/chat/completions`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        model: modelName,
                        messages: [
                            {role: 'user', content: inputText},
                        ],
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                        // Add any required headers like Authorization if needed
                    }
                });

            const json = await response.json();

            const assistantMessage: Message = {
                id: Date.now().toString(),
                text: json.choices[0].message.content,
                sender: 'assistant',
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            // Handle error (e.g., show a notification)
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Scroll to the bottom whenever messages change
        if (flatListRef.current) {
            flatListRef.current.scrollToEnd({animated: true});
        }
    }, [messages]);

    const renderItem = ({item}: { item: Message }) => (
        <MessageContainer sender={item.sender}>
            <MessageBubble sender={item.sender}>
                <StyledMessageText sender={item.sender}>
                    {renderTextWithBold(item.text)}
                </StyledMessageText>
            </MessageBubble>
        </MessageContainer>
    );

    return (
        <Container behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ChatArea>
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{paddingVertical: 10}}
                />
            </ChatArea>

            {loading && <ActivityIndicator size="small" color="#0000ff"/>}

            <InputArea>
                <TextInput
                    placeholder="Type a message..."
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={sendMessage}
                    returnKeyType="send"
                />
                <SendButton onPress={sendMessage}>
                    <SendButtonText>Send</SendButtonText>
                </SendButton>
            </InputArea>
        </Container>
    );
};

export const Container = styled.KeyboardAvoidingView`
    flex: 1;
    background-color: #f5f5f5;
`;

export const ChatArea = styled.View`
    flex: 1;
`;

interface MessageProps {
    sender: 'user' | 'assistant';
}

export const MessageContainer = styled.View<MessageProps>`
    padding: 10px;
    flex-direction: row;
    justify-content: ${({sender}) => (sender === 'user' ? 'flex-end' : 'flex-start')};
`;

export const MessageBubble = styled.View<MessageProps>`
    background-color: ${({sender}) => (sender === 'user' ? '#0084ff' : '#e5e5ea')};
    padding: 10px;
    border-radius: 20px;
    max-width: 80%;
`;

export const MessageText = styled.Text<MessageProps>`
    color: ${({sender}) => (sender === 'user' ? '#fff' : '#000')};
    font-size: 16px;
`;

const StyledMessageText = styled.Text<MessageProps>`
    color: ${({sender}) => (sender === 'user' ? '#fff' : '#000')};
    font-size: 16px;
`;

export const InputArea = styled.View`
    flex-direction: row;
    padding: 10px;
    background-color: #fff;
    align-items: center;
`;

export const TextInput = styled.TextInput`
    flex: 1;
    padding: 10px;
    background-color: #e5e5ea;
    border-radius: 20px;
    font-size: 16px;
    margin-right: 10px;
`;

export const SendButton = styled.TouchableOpacity`
    padding: 10px;
    background-color: #0084ff;
    border-radius: 20px;
`;

export const SendButtonText = styled.Text`
    color: #fff;
    font-size: 16px;
`;

export default ChatScreen;
