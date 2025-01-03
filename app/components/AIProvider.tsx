import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { aiService } from '../services/AIService';

interface AIContextType {
  isInitialized: boolean;
  error: string | null;
}

const AIContext = createContext<AIContextType>({
  isInitialized: false,
  error: null,
});

export const useAI = () => useContext(AIContext);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAI = async () => {
      try {
        await aiService.initialize();
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize AI:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize AI');
      }
    };

    initializeAI();
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red', textAlign: 'center', margin: 20 }}>
          {error}
        </Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 10 }}>Initializing AI capabilities...</Text>
      </View>
    );
  }

  return (
    <AIContext.Provider value={{ isInitialized, error }}>
      {children}
    </AIContext.Provider>
  );
};
