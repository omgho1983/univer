import clsx from 'clsx';

import styles from './index.module.less';

type Shape = 'circle' | 'square';
type AvatarSize = number | 'middle' | 'small';
type ImageFit = 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';

export interface IAvatarProps {
    children?: React.ReactNode;

    /** Semantic DOM style */
    style?: React.CSSProperties;

    /** The title of the image avatar */
    title?: string;

    /** Image description */
    alt?: string;

    /**
     * The shape of the avatar
     * @default 'circle'
     */
    shape?: Shape;

    /**
     * The size of the avatar
     * @default 'middle'
     */
    size?: AvatarSize;

    /** The address of the image for an image avatar or image element */
    src?: string;

    /**
     * The fit of the image avatar
     * @default fill
     */
    fit?: ImageFit;

    /** Handler when img load error */
    onError?: () => void;

    /** Handler when img load success */
    onLoad?: () => void;
}

/**
 * Avatar Component
 */
export function Avatar(props: IAvatarProps) {
    const {
        children,
        style,
        title,
        alt,
        shape = 'circle',
        size = 'middle',
        src,
        fit = 'fill',
        onError,
        onLoad,
    } = props;

    const sizeStyle =
        typeof size === 'number'
            ? {
                  width: size,
                  height: size,
                  lineHeight: `${size}px`,
              }
            : {};

    const _className = clsx(styles.avatar, {
        [styles.avatarCircle]: shape === 'circle',
        [styles.avatarSquare]: shape === 'square',
        [styles.avatarImage]: src,
        [styles.avatarMiddle]: size === 'middle',
        [styles.avatarSmall]: size === 'small',
    });

    const fitStyle = fit ? { objectFit: fit } : {};

    if (src) {
        return (
            <span className={_className} style={{ ...sizeStyle, ...style, ...fitStyle }}>
                <img src={src} title={title} alt={alt} onError={onError} onLoad={onLoad} />
                {children}
            </span>
        );
    }

    return (
        <span className={_className} style={{ ...sizeStyle, ...style }}>
            {children}
        </span>
    );
}
