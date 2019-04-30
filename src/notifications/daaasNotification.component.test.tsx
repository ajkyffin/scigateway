import React from 'react';
import { createShallow, createMount } from '@material-ui/core/test-utils';
import { NotificationWithStyles } from './daaasNotification.component';
import { Action } from 'redux';

function createDaaasNotification(
  severity: string,
  message: string
): React.ReactElement {
  return (
    <NotificationWithStyles
      message={message}
      severity={severity}
      index={0}
      dismissNotification={(): Action => ({ type: 'test' })}
    />
  );
}

describe('Daaas Notification component', () => {
  let shallow;
  let mount;

  beforeEach(() => {
    shallow = createShallow({});
    mount = createMount();
  });

  afterEach(() => {
    mount.cleanUp();
  });

  it('Daaas Notification success message renders correctly', () => {
    const wrapper = shallow(
      createDaaasNotification('success', 'success message')
    );
    expect(wrapper.dive()).toMatchSnapshot();
  });

  it('Daaas Notification warning message renders correctly', () => {
    const wrapper = shallow(
      createDaaasNotification('warning', 'warning message')
    );
    expect(wrapper.dive()).toMatchSnapshot();
  });

  it('Daaas Notification error message renders correctly', () => {
    const wrapper = shallow(createDaaasNotification('error', 'error message'));
    expect(wrapper.dive()).toMatchSnapshot();
  });

  it('an action is fired when Daaas Notification button is clicked', () => {
    const mockDismissFn = jest.fn();

    const wrapper = mount(
      <NotificationWithStyles
        message={'warning message'}
        severity={'warning'}
        index={0}
        dismissNotification={mockDismissFn}
      />
    );

    wrapper.find('button').simulate('click');

    expect(mockDismissFn.mock.calls.length).toEqual(1);
  });
});
