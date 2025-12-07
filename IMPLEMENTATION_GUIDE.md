# File Picker Implementation Guide

## Current Status
The attachment functionality currently simulates file selection. To make it work with real files like WhatsApp, you need to install and configure native modules.

## Required Packages

### 1. Image & Camera Picker
```bash
npm install react-native-image-picker
cd ios && pod install && cd ..
```

**iOS Configuration (Info.plist):**
```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>Allow access to select photos</string>
<key>NSCameraUsageDescription</key>
<string>Allow access to take photos</string>
```

### 2. Document Picker
```bash
npm install react-native-document-picker
cd ios && pod install && cd ..
```

### 3. Contacts Picker (Optional)
```bash
npm install react-native-contacts
cd ios && pod install && cd ..
```

**iOS Configuration (Info.plist):**
```xml
<key>NSContactsUsageDescription</key>
<string>Allow access to contacts</string>
```

### 4. Location (Optional)
```bash
npm install @react-native-community/geolocation
cd ios && pod install && cd ..
```

**iOS Configuration (Info.plist):**
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Allow access to your location</string>
```

## Implementation Steps

### Step 1: Install Packages
Run the installation commands above.

### Step 2: Update ChatRoomScreen.tsx

Replace the simulated handlers with real implementations:

#### For Gallery Picker:
```typescript
import { launchImageLibrary } from 'react-native-image-picker';

const handleGalleryPicker = async () => {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 10, // Allow multiple selection
  });

  if (result.assets) {
    result.assets.forEach((asset) => {
      const newMessage: Message = {
        id: `msg-img-${Date.now()}-${Math.random()}`,
        conversationId,
        senderId: 'current',
        senderName: user?.displayName || 'You',
        content: asset.uri || '[Photo]',
        type: 'IMAGE',
        status: 'SENT',
        isEncrypted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setMessages(prev => [...prev, newMessage]);
    });
  }
};
```

#### For Camera:
```typescript
import { launchCamera } from 'react-native-image-picker';

const handleCameraCapture = async () => {
  const result = await launchCamera({
    mediaType: 'mixed', // photo or video
  });

  if (result.assets && result.assets[0]) {
    const asset = result.assets[0];
    const newMessage: Message = {
      id: `msg-img-${Date.now()}`,
      conversationId,
      senderId: 'current',
      senderName: user?.displayName || 'You',
      content: asset.uri || '[Photo]',
      type: asset.type?.includes('video') ? 'VIDEO' : 'IMAGE',
      status: 'SENT',
      isEncrypted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  }
};
```

#### For Document Picker:
```typescript
import DocumentPicker from 'react-native-document-picker';

const handleDocumentType = async (type: string) => {
  closeDocumentMenu();

  try {
    if (type === 'document') {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.docx],
      });

      if (result[0]) {
        const newMessage: Message = {
          id: `msg-doc-${Date.now()}`,
          conversationId,
          senderId: 'current',
          senderName: user?.displayName || 'You',
          content: `📄 [${result[0].name}]\n${(result[0].size / 1024 / 1024).toFixed(2)} MB`,
          type: 'DOCUMENT',
          status: 'SENT',
          isEncrypted: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setMessages(prev => [...prev, newMessage]);
      }
    } else if (type === 'gallery') {
      handleGalleryPicker();
    } else if (type === 'camera') {
      handleCameraCapture();
    }
  } catch (err) {
    if (!DocumentPicker.isCancel(err)) {
      console.error('Error picking document:', err);
    }
  }
};
```

### Step 3: Test on Device
File pickers require testing on a real device or simulator with proper permissions.

### Step 4: Handle Permissions
Add permission request handling before accessing camera/gallery:
```typescript
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const requestCameraPermission = async () => {
  const result = await request(
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.CAMERA
      : PERMISSIONS.ANDROID.CAMERA
  );
  return result === RESULTS.GRANTED;
};
```

## Notes
- The current implementation uses placeholder content to demonstrate the UI flow
- Real file uploads would also need backend integration
- Consider adding file size limits and type validation
- Add error handling for failed uploads
- Implement upload progress indicators for large files

## Testing Checklist
- [ ] Gallery picker opens and allows selection
- [ ] Camera launches and captures photos
- [ ] Document picker shows files
- [ ] Multiple photo selection works
- [ ] File metadata displays correctly
- [ ] Messages appear in chat after selection
- [ ] Permissions are requested properly
