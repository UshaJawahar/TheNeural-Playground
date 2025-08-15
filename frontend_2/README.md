# TheNeural Playground - Frontend

A machine learning educational tool for kids, inspired by Machine Learning for Kids. This application allows students to learn ML concepts by creating text classification projects and integrating them with Scratch.

## Features

- **User Authentication**: Sign up and login for students and teachers
- **Project Management**: Create, manage, and delete ML projects
- **Text Classification**: Train models to recognize and classify text
- **Interactive Training**: Add labels and examples with an intuitive UI
- **Model Testing**: Test trained models with real-time predictions
- **Scratch Integration**: Use trained models in Scratch projects
- **Multiple Platform Support**: Scratch, Python, and EduBlocks integration

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
frontend_2/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Landing page
│   ├── get-started/       # Authentication flow
│   ├── login/             # Login page
│   ├── signup/            # Sign up page
│   └── projects/          # Project management
│       ├── page.tsx       # Projects listing
│       └── [id]/          # Dynamic project routes
│           ├── page.tsx   # Project detail
│           ├── train/     # Training interface
│           ├── test/      # Testing interface
│           └── make/      # Scratch integration
├── components/            # Reusable components
│   ├── Header.tsx        # Navigation header
│   └── ProjectCreator.tsx # Project creation modal
├── lib/                   # Utilities and API
│   ├── api.ts            # API client
│   └── config.ts         # App configuration
└── public/               # Static assets
```

## User Flow

1. **Landing Page**: Introduction to the platform with clear steps
2. **Authentication**: Sign up or login (or try without registering)
3. **Projects**: View and manage ML projects
4. **Training**: Add labels and training examples
5. **Testing**: Train the model and test predictions
6. **Making**: Export to Scratch, Python, or EduBlocks

## API Integration

The frontend connects to the backend API for:
- User authentication
- Project CRUD operations
- Training data management
- Model training and predictions
- Scratch extension generation

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
