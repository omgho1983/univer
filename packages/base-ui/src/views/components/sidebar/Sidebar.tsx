import { CloseSingle } from '@univerjs/icons';
import { useDependency } from '@wendellhu/redi/react-bindings';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

import { CustomLabel } from '../../../components/custom-label/CustomLabel';
import { ISidebarService } from '../../../services/sidebar/sidebar.service';
import styles from './index.module.less';
import { ISidebarMethodOptions } from './interface';

export function Sidebar() {
    const sidebarService = useDependency(ISidebarService);

    const [sidebarOptions, setSidebarOptions] = useState<ISidebarMethodOptions>({});

    useEffect(() => {
        const sidebar$ = sidebarService.getObservableSidebar();
        const subscribtion = sidebar$.subscribe((options: ISidebarMethodOptions) => {
            setSidebarOptions(options);
        });

        return () => {
            subscribtion.unsubscribe();
        };
    }, []);

    const options = sidebarOptions as Omit<ISidebarMethodOptions, 'children'> & {
        children?: React.ReactNode;
        header?: React.ReactNode;
        footer?: React.ReactNode;
    };
    for (const key of ['children', 'header', 'footer']) {
        const k = key as keyof ISidebarMethodOptions;

        if (sidebarOptions[k]) {
            const props = sidebarOptions[k] as any;

            if (props) {
                (options as any)[k] = <CustomLabel {...props} />;
            }
        }
    }

    const _className = clsx(styles.sidebar, {
        [styles.sidebarOpen]: options.visible,
    });

    const style = {
        width: typeof options.width === 'number' ? `${options.width}px` : options.width,
    };

    function handleClose() {
        const options = {
            ...sidebarOptions,
            visible: false,
        };

        setSidebarOptions(options);

        const sidebar$ = sidebarService.getObservableSidebar();
        sidebar$.next(options);
    }

    return (
        <section className={_className} style={style}>
            <section className={styles.sidebarContainer}>
                <header className={styles.sidebarHeader}>
                    {options?.header}

                    <a className={styles.sidebarHeaderClose} onClick={handleClose}>
                        <CloseSingle />
                    </a>
                </header>

                <section className={styles.sidebarBody}>{options?.children}</section>

                {options?.footer && <footer className={styles.sidebarFooter}>{options.footer}</footer>}
            </section>
        </section>
    );
}
