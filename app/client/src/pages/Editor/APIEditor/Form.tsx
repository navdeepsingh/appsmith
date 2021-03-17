import React, { useState } from "react";
import { connect, useSelector } from "react-redux";
import { formValueSelector, InjectedFormProps, reduxForm } from "redux-form";
import {
  HTTP_METHOD_OPTIONS,
  HTTP_METHODS,
} from "constants/ApiEditorConstants";
import styled from "styled-components";
import FormLabel from "components/editorComponents/FormLabel";
import FormRow from "components/editorComponents/FormRow";
import { PaginationField } from "api/ActionAPI";
import { API_EDITOR_FORM_NAME } from "constants/forms";
import Pagination from "./Pagination";
import { Action, PaginationType } from "entities/Action";
import { HelpBaseURL, HelpMap } from "constants/HelpConstants";
import KeyValueFieldArray from "components/editorComponents/form/fields/KeyValueFieldArray";
import PostBodyData from "./PostBodyData";
import ApiResponseView from "components/editorComponents/ApiResponseView";
import EmbeddedDatasourcePathField from "components/editorComponents/form/fields/EmbeddedDatasourcePathField";
import { AppState } from "reducers";
import { getApiName } from "selectors/formSelectors";
import ActionNameEditor from "components/editorComponents/ActionNameEditor";
import ActionSettings from "pages/Editor/ActionSettings";
import { apiActionSettingsConfig } from "mockResponses/ActionSettings";
import RequestDropdownField from "components/editorComponents/form/fields/RequestDropdownField";
import { useParams } from "react-router-dom";
import Icon from "components/ads/Icon";
import { TabComponent } from "components/ads/Tabs";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import Text, { Case, TextType } from "components/ads/Text";
import { Classes, Variant } from "components/ads/common";
import Callout from "components/ads/Callout";
import { useLocalStorage } from "utils/hooks/localstorage";
import { createMessage, WIDGET_BIND_HELP } from "constants/messages";
import ActionHeader from "pages/common/Actions/ActionHeader";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  height: calc(100vh - ${(props) => props.theme.smallHeaderHeight});
  overflow: hidden;
  width: 100%;
  ${FormLabel} {
    padding: ${(props) => props.theme.spaces[3]}px;
  }
  ${FormRow} {
    ${FormLabel} {
      padding: 0;
      width: 100%;
    }
  }
  .api-info-row {
    input {
      margin-left: ${(props) => props.theme.spaces[1] + 1}px;
    }
  }
`;

const MainConfiguration = styled.div`
  padding: ${(props) => props.theme.spaces[8]}px
    ${(props) => props.theme.spaces[12]}px 0px
    ${(props) => props.theme.spaces[12]}px;
  background-color: ${(props) => props.theme.colors.apiPane.bg};
  height: 124px;
`;

const DatasourceWrapper = styled.div`
  width: 100%;
`;

const SecondaryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100% - 126px);
`;

const TabbedViewContainer = styled.div`
  border-top: 2px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  height: 50%;
  ${FormRow} {
    min-height: auto;
    padding: ${(props) => props.theme.spaces[0]}px;
    & > * {
      margin-right: 0px;
    }
  }

  &&& {
    ul.react-tabs__tab-list {
      padding: 0px ${(props) => props.theme.spaces[12]}px;
      background-color: ${(props) =>
        props.theme.colors.apiPane.responseBody.bg};
    }
    .react-tabs__tab-panel {
      height: calc(100% - 36px);
      background-color: ${(props) => props.theme.colors.apiPane.bg};
    }
  }
`;

export const BindingText = styled.span`
  color: ${(props) => props.theme.colors.bindingTextDark};
  font-weight: 700;
`;

const SettingsWrapper = styled.div`
  padding: 16px 30px;
  height: 100%;
  ${FormLabel} {
    padding: 0px;
  }
`;

const TabSection = styled.div`
  background-color: ${(props) => props.theme.colors.apiPane.bg};
  height: 100%;
  overflow: auto;
`;

const NoBodyMessage = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: center;

  .${Classes.TEXT} {
    color: ${(props) => props.theme.colors.apiPane.body.text};
  }
`;

const CalloutContent = styled.div`
  display: flex;
  align-items: center;
`;

const Link = styled.a`
  display: flex;
  margin-left: ${(props) => props.theme.spaces[1] + 1}px;
  .${Classes.ICON} {
    margin-left: ${(props) => props.theme.spaces[1] + 1}px;
  }
`;

const HelpSection = styled.div`
  padding: ${(props) => props.theme.spaces[4]}px
    ${(props) => props.theme.spaces[12]}px 0px
    ${(props) => props.theme.spaces[12]}px;
`;

interface APIFormProps {
  pluginId: string;
  onRunClick: (paginationField?: PaginationField) => void;
  onDeleteClick: () => void;
  isRunning: boolean;
  isDeleting: boolean;
  paginationType: PaginationType;
  appName: string;
  httpMethodFromForm: string;
  actionConfigurationHeaders?: any;
  actionName: string;
  apiId: string;
  apiName: string;
  headersCount: number;
  paramsCount: number;
}

type Props = APIFormProps & InjectedFormProps<Action, APIFormProps>;

const ApiEditorForm: React.FC<Props> = (props: Props) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [
    apiBindHelpSectionVisible,
    setApiBindHelpSectionVisible,
  ] = useLocalStorage("apiBindHelpSectionVisible", "true");

  const {
    pluginId,
    onRunClick,
    handleSubmit,
    isRunning,
    actionConfigurationHeaders,
    httpMethodFromForm,
    actionName,
    headersCount,
    paramsCount,
  } = props;
  const allowPostBody =
    httpMethodFromForm && httpMethodFromForm !== HTTP_METHODS[0];

  const params = useParams<{ apiId?: string; queryId?: string }>();

  const actions: Action[] = useSelector((state: AppState) =>
    state.entities.actions.map((action) => action.config),
  );
  const currentActionConfig: Action | undefined = actions.find(
    (action) => action.id === params.apiId || action.id === params.queryId,
  );

  const theme = EditorTheme.LIGHT;

  return (
    <Form onSubmit={handleSubmit}>
      <MainConfiguration>
        <ActionHeader
          isLoading={isRunning}
          currentActionConfigId={
            currentActionConfig ? currentActionConfig.id : ""
          }
          currentActionConfigName={
            currentActionConfig ? currentActionConfig.name : ""
          }
          onRunClick={onRunClick}
          actionTitle={<ActionNameEditor page="API_PANE" />}
          runButtonClassName="t--apiFormRunBtn"
          popModifier={{ offset: { offset: "38px 0" } }}
        />
        <FormRow className="api-info-row">
          <RequestDropdownField
            placeholder="Method"
            name="actionConfiguration.httpMethod"
            className="t--apiFormHttpMethod"
            options={HTTP_METHOD_OPTIONS}
            isSearchable={false}
          />
          <DatasourceWrapper className="t--dataSourceField">
            <EmbeddedDatasourcePathField
              name="actionConfiguration.path"
              pluginId={pluginId}
              placeholder="https://mock-api.appsmith.com/users"
              theme={theme}
            />
          </DatasourceWrapper>
        </FormRow>
      </MainConfiguration>
      <SecondaryWrapper>
        <TabbedViewContainer>
          <TabComponent
            tabs={[
              {
                key: "headers",
                title: "Headers",
                count: headersCount,
                panelComponent: (
                  <TabSection>
                    {apiBindHelpSectionVisible && (
                      <HelpSection>
                        <Callout
                          text={createMessage(WIDGET_BIND_HELP)}
                          label={
                            <CalloutContent>
                              <Link
                                href={`${HelpBaseURL}${HelpMap["API_BINDING"].path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Text type={TextType.H6} case={Case.UPPERCASE}>
                                  Learn How
                                </Text>
                                <Icon name="right-arrow" />
                              </Link>
                            </CalloutContent>
                          }
                          variant={Variant.warning}
                          fill
                          closeButton
                          onClose={() => setApiBindHelpSectionVisible(false)}
                        />
                      </HelpSection>
                    )}
                    <KeyValueFieldArray
                      theme={theme}
                      name="actionConfiguration.headers"
                      label="Headers"
                      actionConfig={actionConfigurationHeaders}
                      placeholder="Value"
                      dataTreePath={`${actionName}.config.headers`}
                    />
                  </TabSection>
                ),
              },
              {
                key: "params",
                title: "Params",
                count: paramsCount,
                panelComponent: (
                  <TabSection>
                    <KeyValueFieldArray
                      theme={theme}
                      name="actionConfiguration.queryParameters"
                      label="Params"
                      dataTreePath={`${actionName}.config.queryParameters`}
                    />
                  </TabSection>
                ),
              },
              {
                key: "body",
                title: "Body",
                panelComponent: (
                  <>
                    {allowPostBody ? (
                      <PostBodyData
                        dataTreePath={`${actionName}.config`}
                        theme={theme}
                      />
                    ) : (
                      <NoBodyMessage>
                        <Text type={TextType.P2}>
                          This request does not have a body
                        </Text>
                      </NoBodyMessage>
                    )}
                  </>
                ),
              },
              {
                key: "pagination",
                title: "Pagination",
                panelComponent: (
                  <Pagination
                    onTestClick={props.onRunClick}
                    paginationType={props.paginationType}
                    theme={theme}
                  />
                ),
              },
              {
                key: "settings",
                title: "Settings",
                panelComponent: (
                  <SettingsWrapper>
                    <ActionSettings
                      actionSettingsConfig={apiActionSettingsConfig}
                      formName={API_EDITOR_FORM_NAME}
                      theme={theme}
                    />
                  </SettingsWrapper>
                ),
              },
            ]}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
          />
        </TabbedViewContainer>

        <ApiResponseView theme={theme} />
      </SecondaryWrapper>
    </Form>
  );
};

const selector = formValueSelector(API_EDITOR_FORM_NAME);

export default connect((state: AppState) => {
  const httpMethodFromForm = selector(state, "actionConfiguration.httpMethod");
  const actionConfigurationHeaders = selector(
    state,
    "actionConfiguration.headers",
  );
  const apiId = selector(state, "id");
  const actionName = getApiName(state, apiId) || "";
  const headers = selector(state, "actionConfiguration.headers");
  let headersCount = 0;

  if (Array.isArray(headers)) {
    const validHeaders = headers.filter(
      (value) => value.key && value.key !== "",
    );
    headersCount = validHeaders.length;
  }

  const params = selector(state, "actionConfiguration.queryParameters");
  let paramsCount = 0;

  if (Array.isArray(params)) {
    const validParams = params.filter((value) => value.key && value.key !== "");
    paramsCount = validParams.length;
  }

  return {
    actionName,
    apiId,
    httpMethodFromForm,
    actionConfigurationHeaders,
    headersCount,
    paramsCount,
  };
})(
  reduxForm<Action, APIFormProps>({
    form: API_EDITOR_FORM_NAME,
  })(ApiEditorForm),
);
