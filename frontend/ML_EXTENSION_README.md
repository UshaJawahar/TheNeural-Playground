# ML Extension for Scratch 3.0

This project integrates a custom Machine Learning extension with Scratch 3.0, allowing users to create AI-powered projects using their trained text recognition models.

## 🚀 Features

### **ML Extension Capabilities**
- **Text Recognition**: Predict text categories using trained AI models
- **Confidence Scoring**: Get prediction confidence levels
- **Model Information**: Access model accuracy and available labels
- **Real-time Integration**: Seamlessly integrated with Scratch's block system

### **Custom Scratch Blocks**
The extension adds the following blocks to Scratch:

1. **`predict [text] as [label]`** - Predicts the category of input text
2. **`confidence of [text] prediction`** - Returns confidence score (0-1)
3. **`model accuracy`** - Returns overall model accuracy percentage
4. **`available labels`** - Returns list of available prediction categories

## 🏗️ Architecture

### **Components**

1. **`MLScratchExtension.ts`** - Core extension logic and interfaces
2. **`ScratchGUI.tsx`** - React component that loads Scratch with ML extension
3. **`TextRecognition.tsx`** - Main project interface with Make section
4. **Extension Manager** - Handles extension registration and initialization

### **Data Flow**

```
User Trains Model → Model Data Stored → Extension Initialized → Scratch GUI Loaded → ML Blocks Available
```

## 🎯 Usage

### **1. Train Your Model**
- Use the Train section to create labeled datasets
- Train your model in the Learn section
- Test your model in the Test section

### **2. Open in Scratch**
- Click the "Make" section
- Click "Open Scratch 3.0"
- Wait for ML extension to load

### **3. Use ML Blocks in Scratch**
- Find the new "ML" category in the blocks palette
- Drag ML blocks into your Scratch project
- Connect them with other Scratch blocks

## 🔧 Technical Implementation

### **Extension Injection**
The extension is injected into Scratch using:
- Iframe-based Scratch GUI loading
- JavaScript injection for custom blocks
- Integration with Scratch's virtual machine

### **Model Integration**
```typescript
// Example of how the extension works
const extension = new TextRecognitionExtension();
extension.initialize(trainedModel);
const prediction = extension.predict("Hello World");
const confidence = extension.getConfidence("Hello World");
```

### **Scratch Block System**
Custom blocks are defined with:
- Unique opcodes
- Argument specifications
- Block types (reporter, command, etc.)
- Category placement

## 🌐 Scratch GUI Integration

### **Official Scratch Repository**
This implementation integrates with the [official Scratch GUI repository](https://github.com/scratchfoundation/scratch-gui) by:

1. **Loading Scratch Editor**: Uses `https://scratch.mit.edu/projects/editor/`
2. **Extension Injection**: Attempts to inject custom ML blocks
3. **Runtime Integration**: Connects with Scratch's virtual machine

### **CORS Considerations**
Due to browser security restrictions:
- Direct iframe manipulation may be limited
- Extension injection works best in development environments
- Production deployment may require additional configuration

## 🚧 Development Setup

### **Prerequisites**
- Node.js 16+
- React 18+
- TypeScript 4.5+

### **Installation**
```bash
cd frontend
npm install
```

### **Running the Project**
```bash
npm run dev
```

### **Testing ML Extension**
1. Create a new project
2. Add training data
3. Train the model
4. Click "Make" section
5. Open Scratch with ML extension

## 🔮 Future Enhancements

### **Planned Features**
- **Real-time Model Updates**: Live model retraining in Scratch
- **Custom Block Builder**: Visual block creation interface
- **Model Sharing**: Share trained models between users
- **Advanced ML Tasks**: Support for image recognition, audio processing

### **Scratch Integration Improvements**
- **Native Extension API**: Direct integration with Scratch's extension system
- **Block Customization**: User-defined block appearances
- **Performance Optimization**: Efficient model inference in Scratch

## 📚 Resources

### **Scratch Development**
- [Scratch GUI Repository](https://github.com/scratchfoundation/scratch-gui)
- [Scratch Extension Documentation](https://scratch.mit.edu/developers)
- [Scratch VM Architecture](https://github.com/scratchfoundation/scratch-vm)

### **Machine Learning**
- [TensorFlow.js](https://www.tensorflow.org/js)
- [ML5.js](https://ml5js.org/)
- [Scratch ML Projects](https://scratch.mit.edu/search?q=machine+learning)

## 🤝 Contributing

### **Extension Development**
1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Test with Scratch GUI
5. Submit a pull request

### **Testing**
- Test extension injection in different browsers
- Verify ML block functionality
- Check Scratch project compatibility

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review Scratch GUI documentation
3. Open an issue in the repository
4. Contact the development team

---

**Note**: This extension provides a foundation for ML integration with Scratch. For production use, consider implementing proper security measures and error handling.
