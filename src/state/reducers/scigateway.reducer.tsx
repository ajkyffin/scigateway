import createReducer from './createReducer';
import {
  NotificationType,
  NotificationPayload,
  RegisterRouteType,
  RegisterRoutePayload,
  ToggleDrawerType,
  AuthSuccessType,
  AuthFailureType,
  ConfigureStringsType,
  ConfigureStringsPayload,
  SignOutType,
  FeatureSwitchesPayload,
  ConfigureFeatureSwitchesType,
  LoadingAuthType,
  TokenExpiredType,
  AuthProviderPayload,
  LoadAuthProviderType,
  SiteLoadingPayload,
  SiteLoadingType,
  DismissNotificationType,
  PluginConfig,
  ToggleHelpType,
  AddHelpTourStepsPayload,
  AddHelpTourStepsType,
} from '../scigateway.types';
import { ScigatewayState, AuthState } from '../state.types';
import { buildPluginConfig } from '../pluginhelper';
import log from 'loglevel';
import JWTAuthProvider from '../../authentication/jwtAuthProvider';
import LoadingAuthProvider from '../../authentication/loadingAuthProvider';
import GithubAuthProvider from '../../authentication/githubAuthProvider';
import { Step } from 'react-joyride';

export const authState: AuthState = {
  failedToLogin: false,
  signedOutDueToTokenExpiry: false,
  loading: false,
  provider: new LoadingAuthProvider(),
};

export const initialState: ScigatewayState = {
  notifications: [],
  plugins: [],
  drawerOpen: false,
  siteLoading: true,
  showHelp: false,
  helpSteps: [],
  authorisation: authState,
  features: {
    showContactButton: true,
  },
};

export function handleNotification(
  state: ScigatewayState,
  payload: NotificationPayload
): ScigatewayState {
  return {
    ...state,
    notifications: [
      ...state.notifications,
      { message: payload.message, severity: payload.severity },
    ],
  };
}

export function handleDrawerToggle(state: ScigatewayState): ScigatewayState {
  return {
    ...state,
    drawerOpen: !state.drawerOpen,
  };
}

export function handleConfigureStrings(
  state: ScigatewayState,
  payload: ConfigureStringsPayload
): ScigatewayState {
  return {
    ...state,
    res: payload.res,
  };
}

const updatePlugins = (
  existingPlugins: PluginConfig[],
  payload: RegisterRoutePayload
): PluginConfig[] => {
  if (!existingPlugins.some(p => p.link === payload.link)) {
    return [...existingPlugins, buildPluginConfig(payload)];
  }

  log.error(
    `Duplicate plugin route identified: ${payload.link}.
     ${payload.plugin}:'${payload.displayName}' not registered`
  );
  return existingPlugins;
};

export function handleRegisterPlugin(
  state: ScigatewayState,
  payload: RegisterRoutePayload
): ScigatewayState {
  return {
    ...state,
    plugins: updatePlugins(state.plugins, payload),
  };
}

export const handleLoadingAuth = (state: ScigatewayState): ScigatewayState => ({
  ...state,
  authorisation: {
    ...state.authorisation,
    loading: true,
  },
});

export function handleSuccessfulLogin(state: ScigatewayState): ScigatewayState {
  log.debug(`Successfully logged in`);
  return {
    ...state,
    authorisation: {
      ...state.authorisation,
      failedToLogin: false,
      signedOutDueToTokenExpiry: false,
      loading: false,
    },
  };
}

const resetAuth = (authorisation: AuthState): AuthState => {
  authorisation.provider.logOut();
  return {
    ...authorisation,
    failedToLogin: false,
    signedOutDueToTokenExpiry: false,
    loading: false,
  };
};

export function handleUnsuccessfulLogin(
  state: ScigatewayState,
  payload: null
): ScigatewayState {
  log.debug(`Failed to log in with ${payload}`);
  return {
    ...state,
    drawerOpen: false,
    authorisation: {
      ...resetAuth(state.authorisation),
      failedToLogin: true,
    },
  };
}

export function handleSignOut(state: ScigatewayState): ScigatewayState {
  log.debug(`User is being signed out`);
  return {
    ...state,
    drawerOpen: false,
    authorisation: resetAuth(state.authorisation),
  };
}

export function handleTokenExpiration(state: ScigatewayState): ScigatewayState {
  return {
    ...state,
    drawerOpen: false,
    authorisation: {
      ...resetAuth(state.authorisation),
      signedOutDueToTokenExpiry: true,
    },
  };
}

export function handleConfigureFeatureSwitches(
  state: ScigatewayState,
  payload: FeatureSwitchesPayload
): ScigatewayState {
  return {
    ...state,
    features: payload.switches,
  };
}

export function handleDismissNotification(
  state: ScigatewayState,
  payload: { index: number }
): ScigatewayState {
  return {
    ...state,
    notifications: [
      ...state.notifications.filter(
        (_notification, index) => index !== payload.index
      ),
    ],
  };
}

export function handleAuthProviderUpdate(
  state: ScigatewayState,
  payload: AuthProviderPayload
): ScigatewayState {
  let provider = state.authorisation.provider;
  switch (payload.authProvider) {
    case 'jwt':
      provider = new JWTAuthProvider();
      break;

    case 'github':
      provider = new GithubAuthProvider();
      break;

    default:
      throw Error(
        `Unrecognised auth provider: ${
          payload.authProvider
        }, this is a development issue as there is no implementation registered for this provider.`
      );
  }

  return {
    ...state,
    authorisation: {
      ...resetAuth(state.authorisation),
      provider,
    },
  };
}

export function handleSiteLoadingUpdate(
  state: ScigatewayState,
  payload: SiteLoadingPayload
): ScigatewayState {
  return {
    ...state,
    siteLoading: payload.loading,
  };
}

export function handleToggleHelp(state: ScigatewayState): ScigatewayState {
  return {
    ...state,
    showHelp: !state.showHelp,
  };
}

const updateHelpSteps = (
  existingHelpSteps: Step[],
  newSteps: Step[]
): Step[] => {
  let newHelpSteps = [...existingHelpSteps];

  newSteps.forEach(newStep => {
    if (
      !existingHelpSteps.some(
        existingStep => existingStep.target === newStep.target
      )
    ) {
      newHelpSteps.push(newStep);
    } else {
      log.error(`Duplicate help step target identified: ${newStep.target}.`);
    }
  });
  return newHelpSteps;
};

export function handleAddHelpTourSteps(
  state: ScigatewayState,
  payload: AddHelpTourStepsPayload
): ScigatewayState {
  return {
    ...state,
    helpSteps: updateHelpSteps(state.helpSteps, payload.steps),
    // helpSteps: [...state.helpSteps, ...payload.steps],
  };
}

const ScigatewayReducer = createReducer(initialState, {
  [NotificationType]: handleNotification,
  [ToggleDrawerType]: handleDrawerToggle,
  [RegisterRouteType]: handleRegisterPlugin,
  [AuthSuccessType]: handleSuccessfulLogin,
  [AuthFailureType]: handleUnsuccessfulLogin,
  [LoadingAuthType]: handleLoadingAuth,
  [LoadAuthProviderType]: handleAuthProviderUpdate,
  [ConfigureStringsType]: handleConfigureStrings,
  [SignOutType]: handleSignOut,
  [TokenExpiredType]: handleTokenExpiration,
  [ConfigureFeatureSwitchesType]: handleConfigureFeatureSwitches,
  [DismissNotificationType]: handleDismissNotification,
  [SiteLoadingType]: handleSiteLoadingUpdate,
  [ToggleHelpType]: handleToggleHelp,
  [AddHelpTourStepsType]: handleAddHelpTourSteps,
});

export default ScigatewayReducer;
