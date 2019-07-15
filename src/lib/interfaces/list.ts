export interface IListMeta {
  name: string;
}

export interface IResItem {
  label: string;
  remote: string;
  type: string;
  id: number;
}

export interface IRes {
  template: IResItem;
}

export interface IPromptData {
  namespace: string;
  className: string;
  serviceApi: string;
  url: string;
  mockUrl: string;
  label: string;
  name: string;
}
