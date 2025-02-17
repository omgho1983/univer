import { ErrorSingle, SuccessSingle, WarningSingle } from '@univerjs/icons';
import { createRoot } from 'react-dom/client';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import styles from './index.module.less';

export enum MessageType {
    Success = 'success',
    Warning = 'warning',
    Error = 'error',
}

export interface IMessageProps {
    key: number;
    type: MessageType;
    content?: string;
}

export interface IMessageMethodOptions {
    content: string;
    delay?: number;
}

const iconMap = {
    [MessageType.Success]: <SuccessSingle className={styles.messageIconSuccess} />,
    [MessageType.Warning]: <WarningSingle className={styles.messageIconWarning} />,
    [MessageType.Error]: <ErrorSingle className={styles.messageIconError} />,
};

const MessageItem = (props: IMessageProps) => {
    const { type, content } = props;

    const messageElement = (
        <div className={styles.messageItem}>
            <div className={styles.messageContent}>
                <span className={styles.messageIcon}>{iconMap[type]}</span>
                <span>{content}</span>
            </div>
        </div>
    );

    return messageElement;
};

const MessageContainer = (props: { messages: IMessageProps[] }) => {
    const { messages } = props;

    return (
        <TransitionGroup className={styles.message}>
            {messages.map((message) => (
                <CSSTransition
                    key={message.key}
                    timeout={200}
                    classNames={{
                        enterActive: styles.enterActive,
                        enterDone: styles.enterDone,
                        exitActive: styles.exit,
                        exitDone: styles.exitActive,
                    }}
                >
                    <MessageItem {...message} />
                </CSSTransition>
            ))}
        </TransitionGroup>
    );
};

export class Message {
    private div: HTMLDivElement;
    private root: ReturnType<typeof createRoot>;
    private messages: IMessageProps[] = [];

    constructor(container: HTMLElement) {
        this.div = document.createElement('div');
        container.appendChild(this.div);
        this.root = createRoot(this.div);

        this.render();
    }

    append(type: MessageType, options: IMessageMethodOptions) {
        // eslint-disable-next-line no-magic-numbers
        const { content, delay = 3000 } = options;
        const key = Date.now();

        this.messages.push({
            key,
            type,
            content,
        });

        setTimeout(() => {
            this.teardown(key);
        }, delay);

        this.render();
    }

    teardown(key: number) {
        this.messages = this.messages.filter((message) => message.key !== key);

        this.render();
    }

    render() {
        this.root.render(<MessageContainer messages={this.messages} />);
    }

    success(options: IMessageMethodOptions) {
        this.append(MessageType.Success, options);
    }

    warning(options: IMessageMethodOptions) {
        this.append(MessageType.Warning, options);
    }

    error(options: IMessageMethodOptions) {
        this.append(MessageType.Error, options);
    }
}
