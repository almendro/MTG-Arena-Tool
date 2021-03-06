/* eslint-disable @typescript-eslint/camelcase */
import React, { useCallback } from "react";
import { useSelector } from "react-redux";

import {
  SETTINGS_BEHAVIOUR,
  SETTINGS_ARENA_DATA,
  SETTINGS_OVERLAY,
  SETTINGS_VISUAL,
  SETTINGS_SHORTCUTS,
  SETTINGS_PRIVACY,
  SETTINGS_ABOUT,
  SETTINGS_LOGIN,
  IPC_ALL,
  IPC_RENDERER,
} from "../../shared/constants";

import store, { AppState } from "../../shared/redux/stores/rendererStore";
import SectionBehaviour from "../components/settings/SectionBehaviour";
import SectionData from "../components/settings/SectionData";
import SectionOverlay from "../components/settings/sectionOverlay";
import SectionVisual from "../components/settings/sectionVisual";
import SectionShortcuts from "../components/settings/SectionShortcuts";
import SectionPrivacy from "../components/settings/SectionPrivacy";
import SectionAbout from "../components/settings/SectionAbout";
import SectionLogin from "../components/settings/SectionLogin";
import { reduxAction } from "../../shared/redux/sharedRedux";

import appCss from "../app/app.css";
import css from "./SettingsTab.css";

interface SettingsNavProps {
  component: () => JSX.Element;
  id: number;
  title: string;
  currentTab: number;
  callback: (id: number) => void;
}

function SettingsNav(props: SettingsNavProps): JSX.Element {
  const click = (): void => {
    props.callback(props.id);
  };

  return (
    <div
      className={`${css.settingsNav} ${
        props.currentTab == props.id ? css.navSelected : ""
      }`}
      onClick={click}
    >
      {props.title}
    </div>
  );
}

/**
 * Settings
 * @param props openSection: number
 */
export default function SettingsTab(): JSX.Element {
  const settings = useSelector((state: AppState) => state.settings);
  const currentTab = settings.settings_section;

  const setCurrentTab = useCallback((tab: number) => {
    reduxAction(
      store.dispatch,
      { type: "SET_SETTINGS", arg: { settings_section: tab } },
      IPC_ALL ^ IPC_RENDERER
    );
  }, []);

  const defaultTab = {
    currentTab: currentTab,
    callback: setCurrentTab,
  };

  const tabs: SettingsNavProps[] = [];
  tabs[SETTINGS_BEHAVIOUR] = {
    ...defaultTab,
    id: SETTINGS_BEHAVIOUR,
    component: SectionBehaviour,
    title: "Behaviour",
  };
  tabs[SETTINGS_ARENA_DATA] = {
    ...defaultTab,
    id: SETTINGS_ARENA_DATA,
    component: SectionData,
    title: "Arena Data",
  };
  tabs[SETTINGS_OVERLAY] = {
    ...defaultTab,
    id: SETTINGS_OVERLAY,
    component: SectionOverlay,
    title: "Overlays",
  };
  tabs[SETTINGS_VISUAL] = {
    ...defaultTab,
    id: SETTINGS_VISUAL,
    component: SectionVisual,
    title: "Visual",
  };
  tabs[SETTINGS_SHORTCUTS] = {
    ...defaultTab,
    id: SETTINGS_SHORTCUTS,
    component: SectionShortcuts,
    title: "Shortcuts",
  };
  tabs[SETTINGS_PRIVACY] = {
    ...defaultTab,
    id: SETTINGS_PRIVACY,
    component: SectionPrivacy,
    title: "Privacy",
  };
  tabs[SETTINGS_ABOUT] = {
    ...defaultTab,
    id: SETTINGS_ABOUT,
    component: SectionAbout,
    title: "About",
  };
  tabs[SETTINGS_LOGIN] = {
    ...defaultTab,
    id: SETTINGS_LOGIN,
    component: SectionLogin,
    title: "Login",
  };

  const CurrentSettings = tabs[currentTab].component;
  return (
    <div className={appCss.uxItem}>
      <div className={css.settingsLeft}>
        <div style={{ marginTop: "16px" }}>
          <SettingsNav {...tabs[SETTINGS_BEHAVIOUR]} />
          <SettingsNav {...tabs[SETTINGS_ARENA_DATA]} />
          <SettingsNav {...tabs[SETTINGS_OVERLAY]} />
          <SettingsNav {...tabs[SETTINGS_VISUAL]} />
          <SettingsNav {...tabs[SETTINGS_SHORTCUTS]} />
          <SettingsNav {...tabs[SETTINGS_PRIVACY]} />
          <SettingsNav {...tabs[SETTINGS_ABOUT]} />
          <SettingsNav {...tabs[SETTINGS_LOGIN]} />
        </div>
      </div>
      <div className={css.settingsRight}>
        <div className={css.settingsPage}>
          <div className={css.settingsTitle}>{tabs[currentTab].title}</div>
          <CurrentSettings />
        </div>
      </div>
    </div>
  );
}
