export interface IDeployment {
  color: 'blue' | 'green';
  updatedAt: Date;
  urls: {
    blue: string;
    green: string;
  };
}
