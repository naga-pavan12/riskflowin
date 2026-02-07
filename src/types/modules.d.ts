// Type declarations for modules without TypeScript definitions

declare module 'sonner' {
    import { FC, ReactNode, CSSProperties } from 'react';

    export interface ToasterProps {
        position?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
        theme?: 'light' | 'dark' | 'system';
        richColors?: boolean;
        expand?: boolean;
        duration?: number;
        visibleToasts?: number;
        closeButton?: boolean;
        toastOptions?: {
            style?: CSSProperties;
            className?: string;
            duration?: number;
        };
    }

    export interface ToastOptions {
        id?: string | number;
        duration?: number;
        description?: ReactNode;
        action?: {
            label: string;
            onClick: () => void;
        };
        cancel?: {
            label: string;
            onClick: () => void;
        };
    }

    export const Toaster: FC<ToasterProps>;

    export const toast: {
        (message: ReactNode, options?: ToastOptions): string | number;
        success: (message: ReactNode, options?: ToastOptions) => string | number;
        error: (message: ReactNode, options?: ToastOptions) => string | number;
        warning: (message: ReactNode, options?: ToastOptions) => string | number;
        info: (message: ReactNode, options?: ToastOptions) => string | number;
        loading: (message: ReactNode, options?: ToastOptions) => string | number;
        dismiss: (id?: string | number) => void;
    };
}

declare module 'motion/react' {
    import { ComponentType, CSSProperties, ReactNode } from 'react';

    export interface MotionProps {
        initial?: object | boolean;
        animate?: object;
        exit?: object;
        transition?: {
            duration?: number;
            ease?: string | number[];
            delay?: number;
            type?: string;
        };
        whileHover?: object;
        whileTap?: object;
        whileFocus?: object;
        whileInView?: object;
        className?: string;
        style?: CSSProperties;
        children?: ReactNode;
        key?: string | number;
        [key: string]: any;
    }

    export interface AnimatePresenceProps {
        mode?: 'wait' | 'sync' | 'popLayout';
        initial?: boolean;
        onExitComplete?: () => void;
        children?: ReactNode;
    }

    export const motion: {
        div: ComponentType<MotionProps>;
        span: ComponentType<MotionProps>;
        button: ComponentType<MotionProps>;
        a: ComponentType<MotionProps>;
        ul: ComponentType<MotionProps>;
        li: ComponentType<MotionProps>;
        section: ComponentType<MotionProps>;
        article: ComponentType<MotionProps>;
        header: ComponentType<MotionProps>;
        footer: ComponentType<MotionProps>;
        nav: ComponentType<MotionProps>;
        main: ComponentType<MotionProps>;
        aside: ComponentType<MotionProps>;
        form: ComponentType<MotionProps>;
        input: ComponentType<MotionProps>;
        p: ComponentType<MotionProps>;
        h1: ComponentType<MotionProps>;
        h2: ComponentType<MotionProps>;
        h3: ComponentType<MotionProps>;
        h4: ComponentType<MotionProps>;
        h5: ComponentType<MotionProps>;
        h6: ComponentType<MotionProps>;
        img: ComponentType<MotionProps>;
        svg: ComponentType<MotionProps>;
        path: ComponentType<MotionProps>;
        [key: string]: ComponentType<MotionProps>;
    };

    export const AnimatePresence: ComponentType<AnimatePresenceProps>;
}
