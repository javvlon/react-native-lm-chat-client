// SettingsScreen.tsx

import React, {useState, useEffect} from 'react';
import {ActivityIndicator, Alert, Button} from 'react-native';
import styled from 'styled-components/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Picker} from "@react-native-picker/picker";

interface Model {
    id: string;
    name: string;
}

const SettingsScreen: React.FC = () => {
    const [baseUrl, setBaseUrl] = useState('');
    const [models, setModels] = useState<Model[]>([]);
    const [modelName, setModelName] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchModels = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${baseUrl}/v1/models`);
            const data = await response.json();
            console.log(data.data);
            setModels(data.data); // Adjust based on actual response structure
        } catch (error) {
            console.error('Error fetching models:', error);
            Alert.alert('Error', 'Failed to fetch models');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Load settings from AsyncStorage when the component mounts
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

    useEffect(() => {
        if (baseUrl) {
            fetchModels();
        }
    }, [baseUrl]);

    const saveSettings = async () => {
        try {
            await AsyncStorage.setItem('@settings_baseUrl', baseUrl);
            await AsyncStorage.setItem('@settings_modelName', modelName);
            Alert.alert('Success', 'Settings have been saved.');
        } catch (error) {
            console.error('Error saving settings:', error);
            Alert.alert('Error', 'Failed to save settings. Please try again.');
        }
    };

    return (
        <Container>
            <Label>Base URL</Label>
            <Input
                placeholder="Enter Base URL"
                value={baseUrl}
                onChangeText={setBaseUrl}
            />

            <Label>Model Name (Selected: {modelName})</Label>
            {loading ? (
                <ActivityIndicator size="small" color="#0000ff"/>
            ) : (
                <PickerContainer>
                    <Picker
                        selectedValue={modelName}
                        onValueChange={(itemValue) => setModelName(itemValue)}
                    >
                        <Picker.Item label="Select a model" value=""/>
                        {models.map((model) => (
                            <Picker.Item key={model.id} label={model.id} value={model.id}/>
                        ))}
                    </Picker>
                </PickerContainer>
            )}


            <SaveButton onPress={saveSettings}>
                <ButtonText>Save Settings</ButtonText>
            </SaveButton>
        </Container>
    );
};

export const Container = styled.View`
    flex: 1;
    padding: 20px;
    background-color: #f5f5f5;
`;

export const Label = styled.Text`
    font-size: 18px;
    margin-bottom: 8px;
    color: #333;
`;

export const Input = styled.TextInput`
    padding: 10px;
    background-color: #e5e5ea;
    border-radius: 8px;
    font-size: 16px;
    margin-bottom: 20px;
`;

export const PickerContainer = styled.View`
    background-color: #e5e5ea;
    border-radius: 8px;
    margin-bottom: 20px;
`;

export const SaveButton = styled.TouchableOpacity`
    padding: 15px;
    background-color: #0084ff;
    border-radius: 8px;
    align-items: center;
`;

export const ButtonText = styled.Text`
    color: #fff;
    font-size: 16px;
    font-weight: bold;
`;

export default SettingsScreen;
