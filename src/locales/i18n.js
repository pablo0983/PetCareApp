import { I18n } from 'i18n-js';
import en from './en.json';
import es from './es.json';
import pt from './pt.json';

const i18n = new I18n({ en, es, pt });
i18n.enableFallback = true;

export default i18n;
