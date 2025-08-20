import React from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';

export default function SimpleApp() {
  const handlePress = () => {
    Alert.alert('성공!', '앱이 정상적으로 작동중입니다!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SummaNews</Text>
      <Text style={styles.subtitle}>앱이 실행되었습니다!</Text>
      <Button 
        title="테스트 버튼" 
        onPress={handlePress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A4DFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
});