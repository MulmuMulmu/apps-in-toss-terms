import React, { useEffect } from 'react';
import { showAppDialog } from '../components/AppDialogHost';
import { View, Text, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function ReceiptGalleryScreen({ navigation }) {
  useEffect(() => {
    openGallery();
  }, []);

  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showAppDialog('알림', '갤러리 접근 권한이 필요해요!');
      navigation.goBack();
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      navigation.replace('ReceiptLoading', { photoUri: result.assets[0].uri });
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>갤러리 불러오는 중...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBF9FF',
  },
  text: {
    fontSize: 16,
    color: '#495057',
  },
});