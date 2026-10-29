import type {Pack} from '../../engine/pack';
import {catalog} from './catalog';
import {Background} from './Background';
import {Character} from './Character';
import {Prop} from './Props';

export const flatBasic: Pack = {catalog, Background, Character, Prop};
