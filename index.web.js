import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('PhotoHealthy', () => App);
AppRegistry.runApplication('PhotoHealthy', {
  rootTag: document.getElementById('root'),
});

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
