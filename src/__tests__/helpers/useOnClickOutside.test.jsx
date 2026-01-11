import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { useOnClickOutside } from '../../jsx/helpers/useOnClickOutside';

describe('useOnClickOutside Hook', () => {
  it('calls handler when clicking outside the ref element', () => {
    const handler = jest.fn();
    const { result } = renderHook(() => {
      const ref = useRef(document.createElement('div'));
      useOnClickOutside(ref, handler);
      return ref;
    });

    // Simulate click outside
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);
    document.body.appendChild(result.current.current);

    const clickEvent = new MouseEvent('click', { bubbles: true });
    outsideElement.dispatchEvent(clickEvent);

    expect(handler).toHaveBeenCalled();
  });

  it('does not call handler when clicking inside the ref element', () => {
    const handler = jest.fn();
    const { result } = renderHook(() => {
      const ref = useRef(document.createElement('div'));
      useOnClickOutside(ref, handler);
      return ref;
    });

    // Simulate click inside
    const insideElement = document.createElement('span');
    result.current.current.appendChild(insideElement);
    document.body.appendChild(result.current.current);

    const clickEvent = new MouseEvent('click', { bubbles: true });
    insideElement.dispatchEvent(clickEvent);

    expect(handler).not.toHaveBeenCalled();
  });

  it('cleans up event listeners on unmount', () => {
    const handler = jest.fn();
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => {
      const ref = useRef(document.createElement('div'));
      useOnClickOutside(ref, handler);
      return ref;
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
  });
});

