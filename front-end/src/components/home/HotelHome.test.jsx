import { fireEvent, render, screen, within } from '@testing-library/react';
import HotelHome from './HotelHome';

beforeEach(() => { Element.prototype.scrollIntoView=jest.fn(); });

test('animated menu supports escape, focus restoration, and immediate portal access', () => {
  const onReturn=jest.fn();
  render(<HotelHome onReturn={onReturn} />);
  const trigger=screen.getByRole('button',{name:'Open hotel menu'});
  fireEvent.click(trigger);
  const menu=screen.getByRole('dialog');
  expect(within(menu).getByRole('button',{name:'Close hotel menu'})).toHaveFocus();
  fireEvent.click(within(menu).getByRole('button',{name:'Return to Employee Portal'}));
  expect(onReturn).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(document,{key:'Escape'});
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

test('pause motion stops the showcase animations and keeps section navigation available', () => {
  const {container}=render(<HotelHome onReturn={()=>{}} />);
  fireEvent.click(screen.getByRole('button',{name:/pause motion/i}));
  expect(container.firstChild).toHaveClass('hotel-motion-paused');
  fireEvent.click(screen.getByRole('link',{name:'Our rooms'}));
  expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({behavior:'auto',block:'start'});
});
