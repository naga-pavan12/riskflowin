import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import './styles/index.css';
import { ProjectProvider } from './store/ProjectContext.tsx';
import { PulseProvider } from './store/PulseContext.tsx';

createRoot(document.getElementById('root')!).render(
    <ProjectProvider>
        <PulseProvider>
            <App />
        </PulseProvider>
    </ProjectProvider>
);
