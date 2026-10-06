import type { ComponentType } from 'react'
import { Box, Boards, Column, Gable, Ramp, Rug } from './basic'
import { GrandfatherClock, MantelClock } from './clocks'
import { Counterweight, Crate, DeskLamp, Frame, MeridianSymbol } from './decor'
import { Blocker, Fence, Forest, Gate, GlowWindow, Ground, Mountains, Rain, Sky } from './exterior'
import { BookshelfStatic, Chair, Chandelier, CoatRack, Desk, Fireplace, Pedestal, SideTable, Staircase, Table, UmbrellaStand } from './furniture'
import { Door, Drawer, SecretBookcase } from './movers'
import type { PropProps } from './params'
import { KeyProp, MatchboxProp, OilLampProp, Paper, PhotoFrame, TapeRecorder } from './smallItems'

/**
 * Registro de props procedurais: o campo "type" dos objetos nos JSON de áreas.
 * collider: 'auto' = cuboides automáticos a partir das malhas; 'none' = o prop cuida da própria física (ou não tem).
 * selfTransform: o prop aplica posição/rotação por conta própria (corpos cinemáticos).
 */
export interface PropEntry {
  component: ComponentType<PropProps>
  collider: 'auto' | 'none'
  selfTransform?: boolean
}

const auto = (component: ComponentType<PropProps>): PropEntry => ({ component, collider: 'auto' })
const none = (component: ComponentType<PropProps>): PropEntry => ({ component, collider: 'none' })

export const propRegistry: Record<string, PropEntry> = {
  Box: auto(Box),
  Gable: auto(Gable),
  Column: auto(Column),
  Ramp: none(Ramp),
  Rug: none(Rug),
  Boards: none(Boards),
  Table: auto(Table),
  SideTable: auto(SideTable),
  Chair: auto(Chair),
  Desk: auto(Desk),
  Drawer: none(Drawer),
  Bookshelf: none(BookshelfStatic),
  Fireplace: auto(Fireplace),
  Staircase: none(Staircase),
  Chandelier: none(Chandelier),
  CoatRack: auto(CoatRack),
  UmbrellaStand: auto(UmbrellaStand),
  Pedestal: auto(Pedestal),
  GrandfatherClock: auto(GrandfatherClock),
  MantelClock: none(MantelClock),
  Frame: none(Frame),
  DeskLamp: none(DeskLamp),
  Symbol: none(MeridianSymbol),
  Counterweight: none(Counterweight),
  Crate: auto(Crate),
  Door: { component: Door, collider: 'none', selfTransform: true },
  SecretBookcase: { component: SecretBookcase, collider: 'none', selfTransform: true },
  Key: none(KeyProp),
  OilLamp: none(OilLampProp),
  Matchbox: none(MatchboxProp),
  Paper: none(Paper),
  PhotoFrame: none(PhotoFrame),
  TapeRecorder: none(TapeRecorder),
  Ground: none(Ground),
  Blocker: none(Blocker),
  Sky: none(Sky),
  Mountains: none(Mountains),
  Forest: none(Forest),
  Fence: none(Fence),
  Gate: none(Gate),
  Rain: none(Rain),
  GlowWindow: none(GlowWindow),
}
