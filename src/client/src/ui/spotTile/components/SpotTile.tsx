/* tslint:disable */

import numeral from 'numeral'
import React, { PureComponent, useContext } from 'react'
import { CurrencyPair, Direction, ServiceConnectionStatus } from 'rt-types'
import { createTradeRequest, DEFAULT_NOTIONAL, ExecuteTradeRequest, SpotTileData, TradeRequest } from '../model'
import { spotDateFormatter } from '../model/dateUtils'
import NotionalInput from './notional'
import PriceControls from './PriceControls'
import { DeliveryDate, TileBaseStyle, TileHeader, TileSymbol } from './styled'
import { styled } from 'rt-theme'
import { PlatformAdapter, PlatformContext } from 'rt-components'
import { TopRightButton, BottomRightButton } from './TileControls'

const SpotTileWrapper: React.SFC = ({ children }) => {
  const platform = useContext(PlatformContext)

  const SpotTileWrapperStyle = styled.div<{ platform: PlatformAdapter }>`
    position: relative;
    min-height: 10rem;
    height: ${({ platform: { name } }) =>
      name !== 'finsemble'
        ? '100%'
        : 'calc(100% - 25px)'}; // When loaded in Finsemble a 25px header is injected, this resets body to the correct height
    &:hover ${TopRightButton} {
      opacity: 0.75;
    }
    &:hover ${BottomRightButton} {
      opacity: 0.75;
    }
    color: ${({ theme }) => theme.core.textColor};
  `

  return <SpotTileWrapperStyle platform={platform}>{children}</SpotTileWrapperStyle>
}

export const SpotTileStyle = styled(TileBaseStyle)`
  background-color: ${({ theme }) => theme.core.lightBackground};
  display: flex;
  height: 100%;
  justify-content: space-between;
  flex-direction: column;
  overflow: hidden;
`

export interface Props {
  currencyPair: CurrencyPair
  spotTileData: SpotTileData
  executionStatus: ServiceConnectionStatus
  executeTrade: (tradeRequestObj: ExecuteTradeRequest) => void
}

interface State {
  notional: string
}

export default class SpotTile extends PureComponent<Props, State> {
  state = {
    notional: '1000000',
  }

  updateNotional = (notional: string) => this.setState({ notional })

  executeTrade = (direction: Direction, rawSpotRate: number) => {
    const { currencyPair, executeTrade } = this.props
    const notional = this.getNotional()
    const tradeRequestObj: TradeRequest = {
      direction,
      currencyBase: currencyPair.base,
      symbol: currencyPair.symbol,
      notional,
      rawSpotRate,
    }
    executeTrade(createTradeRequest(tradeRequestObj))
  }

  getNotional = () => numeral(this.state.notional).value() || DEFAULT_NOTIONAL

  canExecute = () => {
    const { spotTileData, executionStatus } = this.props
    return Boolean(
      executionStatus === ServiceConnectionStatus.CONNECTED &&
        !spotTileData.isTradeExecutionInFlight &&
        spotTileData.price,
    )
  }

  render() {
    const {
      currencyPair,
      spotTileData: { price },
      children,
    } = this.props
    const { notional } = this.state

    const spotDate = spotDateFormatter(price.valueDate, false).toUpperCase()

    return (
      <SpotTileWrapper>
        <SpotTileStyle className="spot-tile">
          <TileHeader>
            <TileSymbol>{`${currencyPair.base}/${currencyPair.terms}`}</TileSymbol>
            <DeliveryDate className="delivery-date">{spotDate && `SPT (${spotDate})`} </DeliveryDate>
          </TileHeader>
          <PriceControls
            executeTrade={this.executeTrade}
            priceData={price}
            currencyPair={currencyPair}
            disabled={!this.canExecute()}
          />
          <NotionalInput
            notional={notional}
            currencyPairSymbol={currencyPair.base}
            updateNotional={this.updateNotional}
          />
        </SpotTileStyle>
        {children}
      </SpotTileWrapper>
    )
  }
}
