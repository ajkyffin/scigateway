import mockAxios from 'axios';
import JWTAuthProvider from './jwtAuthProvider';
import ReactGA from 'react-ga';

describe('jwt auth provider', () => {
  let jwtAuthProvider: JWTAuthProvider;

  beforeEach(() => {
    jest.spyOn(window.localStorage.__proto__, 'getItem');
    window.localStorage.__proto__.getItem = jest
      .fn()
      .mockImplementation((name) =>
        name === 'scigateway:token' ? 'token' : null
      );
    window.localStorage.__proto__.removeItem = jest.fn();
    window.localStorage.__proto__.setItem = jest.fn();

    jwtAuthProvider = new JWTAuthProvider('http://localhost:8000');
    ReactGA.initialize('test id', { testMode: true, titleCase: false });
  });

  afterEach(() => {
    ReactGA.testModeAPI.resetCalls();
    (mockAxios.post as jest.Mock).mockClear();
  });

  it('should load the token when built', () => {
    expect(localStorage.getItem).toBeCalledWith('scigateway:token');
    expect(jwtAuthProvider.isLoggedIn()).toBeTruthy();
  });

  it('should clear the token when logging out', () => {
    jwtAuthProvider.logOut();

    expect(localStorage.removeItem).toBeCalledWith('scigateway:token');
    expect(jwtAuthProvider.isLoggedIn()).toBeFalsy();
  });

  it('should successfully log in if user is already logged in', () => {
    return jwtAuthProvider.logIn('user', 'password');
  });

  it('should call the api to authenticate', async () => {
    (mockAxios.post as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        data: {
          token: 'token',
        },
      })
    );

    // ensure the token is null
    jwtAuthProvider.logOut();

    await jwtAuthProvider.logIn('user', 'password');

    expect(localStorage.setItem).toBeCalledWith('scigateway:token', 'token');

    expect(jwtAuthProvider.isLoggedIn()).toBeTruthy();
    expect(jwtAuthProvider.user.username).toBe('user');

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
    jwtAuthProvider.logOut();

    await jwtAuthProvider.logIn('user', 'invalid').catch(() => {
      // catch error
    });

    expect(localStorage.removeItem).toBeCalledWith('scigateway:token');
    expect(jwtAuthProvider.isLoggedIn()).toBeFalsy();

    expect(ReactGA.testModeAPI.calls[1][0]).toEqual('send');
    expect(ReactGA.testModeAPI.calls[1][1]).toEqual({
      eventAction: 'Failed to log in via JWT',
      eventCategory: 'Login',
      hitType: 'event',
    });
  });

  it('should call api to verify token', async () => {
    (mockAxios.post as jest.Mock).mockImplementation(() => Promise.resolve());

    await jwtAuthProvider.verifyLogIn();

    expect(mockAxios.post).toBeCalledWith(
      'http://localhost:8000/api/jwt/checkToken',
      {
        token: 'token',
      }
    );
  });

  it('should call refresh if the access token has expired', async () => {
    (mockAxios.post as jest.Mock).mockImplementation(() =>
      Promise.reject({
        response: {
          status: 401,
        },
      })
    );

    const refreshSpy = jest
      .spyOn(jwtAuthProvider, 'refresh')
      .mockImplementationOnce(() => Promise.resolve());

    await jwtAuthProvider.verifyLogIn().catch(() => {
      // catch error
    });

    expect(refreshSpy).toHaveBeenCalled();
  });

  it('should update the token if the refresh method is successful', async () => {
    (mockAxios.post as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        data: { token: 'new-token' },
      })
    );

    await jwtAuthProvider.refresh();

    expect(mockAxios.post).toHaveBeenCalledWith(
      'http://localhost:8000/api/jwt/refresh',
      {
        token: 'token',
      }
    );
    expect(localStorage.setItem).toBeCalledWith(
      'scigateway:token',
      'new-token'
    );
  });

  it('should log the user out if the refresh token has expired', async () => {
    (mockAxios.post as jest.Mock).mockImplementation(() =>
      Promise.reject({
        response: {
          status: 401,
        },
      })
    );

    await jwtAuthProvider.refresh().catch(() => {
      // catch error
    });

    expect(localStorage.removeItem).toBeCalledWith('scigateway:token');
    expect(jwtAuthProvider.isLoggedIn()).toBeFalsy();
  });
});
