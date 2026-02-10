import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import './styles/index.css';
import { ProjectProvider } from './store/ProjectContext.tsx';

createRoot(document.getElementById('root')!).render(
    <ProjectProvider>
        <App />
    </ProjectProvider>
);
