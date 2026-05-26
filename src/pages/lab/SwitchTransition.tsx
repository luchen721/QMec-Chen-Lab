import type { ReactNode } from 'react';

type SwitchTransitionProps<T> = {
  activeIndex: number;
  className?: string;
  getKey?: (item: T, index: number) => string | number;
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
};

export function SwitchTransition<T>({
  activeIndex,
  className,
  getKey,
  items,
  renderItem,
}: SwitchTransitionProps<T>) {
  return (
    <div className={className ? `switch-transition ${className}` : 'switch-transition'}>
      {items.map((item, index) => {
        const isActive = index === activeIndex;

        return (
          <div
            aria-hidden={!isActive}
            className={isActive ? 'switch-transition-item is-active' : 'switch-transition-item'}
            key={getKey ? getKey(item, index) : index}
          >
            {renderItem(item, index)}
          </div>
        );
      })}
    </div>
  );
}

