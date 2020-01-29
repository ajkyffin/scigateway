import mockAxios from 'axios';
import ICATAuthProvider from './icatAuthProvider';
import ReactGA from 'react-ga';
import parseJwt from './parseJwt';

jest.mock('./parseJwt');

describe('ICAT auth provider', () => {
  let icatAuthProvider: ICATAuthProvider;

  beforeEach(() => {
    jest.spyOn(window.localStorage.__proto__, 'getItem');
    window.localStorage.__proto__.getItem = jest
      .fn()
      .mockImplementation(name =>
        name === 'scigateway:token' ? 'token' : null
      );
    window.localStorage.__proto__.removeItem = jest.fn();
    window.localStorage.__proto__.setItem = jest.fn();

    icatAuthProvider = new ICATAuthProvider('mnemonic');
    ReactGA.initialize('test id', { testMode: true, titleCase: false });
    (parseJwt as jest.Mock).mockImplementation(
      token => `{"sessionId": "${token}", "username": "${token} username"}`
    );
  });

  afterEach(() => {
    ReactGA.testModeAPI.resetCalls();
  });

  it('should load the token when built', () => {
    expect(localStorage.getItem).toBeCalledWith('scigateway:token');
    expect(icatAuthProvider.isLoggedIn()).toBeTruthy();
  });

  it('should clear the token when logging out', () => {
    icatAuthProvider.logOut();

    expect(localStorage.removeItem).toBeCalledWith('scigateway:token');
    expect(icatAuthProvider.isLoggedIn()).toBeFalsy();
  });

  it('should successfully log in if user is already logged in', () => {
    return icatAuthProvider.logIn('user', 'password');
  });

  it('should call the api to authenticate', async () => {
    (mockAxios.post as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        data: 'token',
      })
    );

    // ensure the token is null
    icatAuthProvider.logOut();

    await icatAuthProvider.logIn('user', 'password');

    expect(mockAxios.post).toHaveBeenCalledWith('/login', {
      mnemonic: 'mnemonic',
      credentials: { username: 'user', password: 'password' },
    });
    expect(localStorage.setItem).toBeCalledWith('scigateway:token', 'token');

    expect(icatAuthProvider.isLoggedIn()).toBeTruthy();
    expect(icatAuthProvider.user.username).toBe('token username');

    expect(ReactGA.testModeAPI.calls[1][0]).toEqual('send');
    expect(ReactGA.testModeAPI.calls[1][1]).toEqual({
      eventAction: 'Sucessfully logged in via JWT',
      eventCategory: 'Login',
      hitType: 'event',
    });
  });

  it('should log the user out for an invalid login attempt', async () => {
    (mockAxios.post as jest.Mock).mockImplementation(() =>
      Promise.reject({
        response: {
          status: 401,
        },
      })
    );

    // ensure the token is null
    icatAuthProvider.logOut();

    await icatAuthProvider.logIn('user', 'invalid').catch(() => {});

    expect(localStorage.removeItem).toBeCalledWith('scigateway:token');
    expect(icatAuthProvider.isLoggedIn()).toBeFalsy();

    expect(ReactGA.testModeAPI.calls[1][0]).toEqual('send');
    expect(ReactGA.testModeAPI.calls[1][1]).toEqual({
      eventAction: 'Failed to log in via JWT',
      eventCategory: 'Login',
      hitType: 'event',
    });
  });

  it('should call api to verify token', async () => {
    (mockAxios.post as jest.Mock).mockImplementation(() => Promise.resolve());

    await icatAuthProvider.verifyLogIn();

    expect(mockAxios.post).toBeCalledWith('/verify', {
      token: 'token',
    });
  });

  it('should log the user out if the token has expired', async () => {
    (mockAxios.post as jest.Mock).mockImplementation(() =>
      Promise.reject({
        response: {
          status: 401,
        },
      })
    );

    // ensure the token is null
    icatAuthProvider.logOut();

    await icatAuthProvider.verifyLogIn().catch(() => {});

    expect(localStorage.removeItem).toBeCalledWith('scigateway:token');
    expect(icatAuthProvider.isLoggedIn()).toBeFalsy();
  });
});
