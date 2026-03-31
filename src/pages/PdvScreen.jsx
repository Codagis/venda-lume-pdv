import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import {
  Input,
  Select,
  Button,
  InputNumber,
  Space,
  Modal,
  Form,
  Divider,
  Collapse,
  Checkbox,
  Spin,
  Radio,
  Table,
  Card,
  Row,
  Col,
  Typography,
  Empty,
  Alert,
  Tooltip,
  Grid,
  message,
} from 'antd'
import { maskCpfCnpjBr } from '../utils/masks'
import {
  BarcodeOutlined,
  SearchOutlined,
  PlusOutlined,
  MinusOutlined,
  DeleteOutlined,
  UserAddOutlined,
  FilePdfOutlined,
  CheckCircleOutlined,
  CarOutlined,
  LogoutOutlined,
  CloseOutlined,
  DollarOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  ClockCircleOutlined,
  SlidersOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAuth } from '../contexts/AuthContext'
import { useSalesPDV } from '../hooks/useSalesPDV'
import { SALE_TYPE_OPTIONS, PAYMENT_METHOD_OPTIONS_PDV } from '../services/salesService'
import './PdvScreen.css'

const { Title, Text } = Typography

const PDV_FUNCTION_KEYS = new Set(['F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11'])

function formatPrice(value) {
  if (value == null) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function PdvScreen() {
  const { user, logout } = useAuth()
  const pdv = useSalesPDV()
  const screens = Grid.useBreakpoint()
  const searchInputRef = pdv.searchInputRef
  const amountReceivedRef = useRef(null)
  const customerSearchInputRef = useRef(null)
  const customerItemRefs = useRef([])
  const [now, setNow] = useState(dayjs())
  const [productHighlight, setProductHighlight] = useState(0)
  const [cartRowIndex, setCartRowIndex] = useState(0)
  const [adjustmentsActiveKey, setAdjustmentsActiveKey] = useState([])
  const [viewportH, setViewportH] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800,
  )

  useEffect(() => {
    const update = () => setViewportH(window.visualViewport?.height ?? window.innerHeight)
    update()
    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)
    return () => {
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
    }
  }, [])

  const cartTableScrollY = useMemo(() => {
    const vh = viewportH
    const rowCount = pdv.cart.length
    const theadApprox = 46
    const rowApprox = 54
    const bodyPadding = 12
    const contentNeeded = rowCount > 0 ? theadApprox + rowCount * rowApprox + bodyPadding : 100

    let cap
    if (screens.xxl) cap = Math.min(680, Math.max(280, Math.floor(vh * 0.5)))
    else if (screens.xl) cap = Math.min(620, Math.max(260, Math.floor(vh * 0.46)))
    else if (screens.lg) cap = Math.min(560, Math.max(240, Math.floor(vh * 0.42)))
    else if (screens.md) cap = Math.min(420, Math.max(200, Math.floor(vh * 0.36)))
    else cap = Math.min(340, Math.max(160, Math.floor(vh * 0.3)))

    /* Poucos itens: altura próxima ao conteúdo; muitos: até o teto da viewport */
    return Math.min(cap, Math.max(96, contentNeeded))
  }, [screens.xxl, screens.xl, screens.lg, screens.md, viewportH, pdv.cart.length])

  const searchDropdownOpen = Boolean(
    pdv.productSearch?.trim() && (pdv.productResults.length > 0 || pdv.loadingProducts),
  )

  useEffect(() => {
    setProductHighlight(0)
  }, [pdv.productResults])

  useEffect(() => {
    if (pdv.cart.length === 0) setCartRowIndex(0)
    else setCartRowIndex((i) => Math.min(Math.max(0, i), pdv.cart.length - 1))
  }, [pdv.cart])

  useEffect(() => {
    searchInputRef.current?.focus?.()
  }, [searchInputRef])

  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 1000)
    return () => clearInterval(t)
  }, [])

  const focusAmountReceived = useCallback(() => {
    const el = amountReceivedRef.current
    if (el && typeof el.focus === 'function') el.focus()
    else {
      const input = document.getElementById('pdv-amount-received')
      input?.focus?.()
    }
  }, [])

  const handleKeyDown = useCallback((e) => {
    if (pdv.successModalOpen || pdv.customerModalOpen) return

    const target = e.target
    const tag = target?.tagName
    const isInputLike = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
    if (isInputLike && !PDV_FUNCTION_KEYS.has(e.key)) return

    const cartLen = pdv.cart.length
    const isAltCartNav =
      e.altKey &&
      !e.ctrlKey &&
      !e.metaKey &&
      cartLen > 0 &&
      (e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'Home' ||
        e.key === 'End' ||
        e.key === 'Delete' ||
        e.code === 'NumpadAdd' ||
        e.code === 'NumpadSubtract' ||
        e.code === 'Equal' ||
        e.code === 'Minus')

    if (isInputLike && isAltCartNav) {
      e.preventDefault()
      return
    }

    if (!isInputLike && isAltCartNav) {
      e.preventDefault()
      const lineAt = (idx) => pdv.cart[Math.min(Math.max(0, idx), cartLen - 1)]

      if (e.key === 'ArrowUp') {
        setCartRowIndex((i) => Math.max(0, i - 1))
        return
      }
      if (e.key === 'ArrowDown') {
        setCartRowIndex((i) => Math.min(cartLen - 1, i + 1))
        return
      }
      if (e.key === 'Home') {
        setCartRowIndex(0)
        return
      }
      if (e.key === 'End') {
        setCartRowIndex(cartLen - 1)
        return
      }
      if (e.key === 'Delete') {
        const line = lineAt(cartRowIndex)
        if (line) pdv.removeFromCart(line.productId)
        return
      }
      const qtyPlus = e.code === 'NumpadAdd' || e.code === 'Equal'
      const qtyMinus = e.code === 'NumpadSubtract' || e.code === 'Minus'
      if (qtyPlus || qtyMinus) {
        const line = lineAt(cartRowIndex)
        if (!line) return
        const q = line.quantity || 1
        if (qtyPlus) pdv.updateCartItem(line.productId, 'quantity', q + 1)
        else pdv.updateCartItem(line.productId, 'quantity', Math.max(0.1, q - 1))
        return
      }
    }

    switch (e.key) {
      case 'F2':
        e.preventDefault()
        searchInputRef.current?.focus?.()
        break
      case 'F3':
        e.preventDefault()
        if (pdv.saleStatus === 'COMPLETED' && !['CREDIT_CARD', 'DEBIT_CARD', 'PIX'].includes(pdv.paymentMethod)) {
          focusAmountReceived()
        } else {
          message.info({ content: 'Valor recebido editável em Dinheiro (F6).', duration: 2.5 })
        }
        break
      case 'F4':
        e.preventDefault()
        setAdjustmentsActiveKey((k) => (k.length ? [] : ['adjustments']))
        break
      case 'F5':
        e.preventDefault()
        pdv.setPaymentMethod('PIX')
        break
      case 'F6':
        e.preventDefault()
        pdv.setPaymentMethod('CASH')
        break
      case 'F7':
        e.preventDefault()
        pdv.setPaymentMethod('DEBIT_CARD')
        break
      case 'F8':
        e.preventDefault()
        pdv.setPaymentMethod('CREDIT_CARD')
        break
      case 'F9':
        e.preventDefault()
        if (pdv.cart.length > 0 && !pdv.submitting) pdv.handleFinish()
        break
      case 'F10':
        e.preventDefault()
        if (pdv.cart.length > 0) pdv.removeFromCart(pdv.cart[pdv.cart.length - 1].productId)
        break
      case 'F11':
        e.preventDefault()
        pdv.openCustomerModal()
        break
      default:
        break
    }
  }, [pdv, cartRowIndex, searchInputRef, focusAmountReceived])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const currentRegisterName = pdv.registers.find((r) => r.id === pdv.selectedRegisterId)?.name

  const pickProductAndFocus = useCallback(
    (p) => {
      if (!p) return
      pdv.addToCart(p)
      pdv.setProductSearch('')
      pdv.setProductResults([])
      searchInputRef.current?.focus?.()
    },
    [pdv, searchInputRef],
  )

  const handleSearchKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && pdv.productSearch) {
        e.preventDefault()
        pdv.setProductSearch('')
        pdv.setProductResults([])
        return
      }
      if (!searchDropdownOpen || pdv.loadingProducts) return
      const { productResults } = pdv
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setProductHighlight((i) => Math.min(i + 1, Math.max(0, productResults.length - 1)))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setProductHighlight((i) => Math.max(0, i - 1))
      } else if (e.key === 'Escape') {
        e.preventDefault()
        pdv.setProductSearch('')
        pdv.setProductResults([])
      } else if (e.key === 'Enter' && productResults.length > 0) {
        e.preventDefault()
        const p = productResults[productHighlight] ?? productResults[0]
        pickProductAndFocus(p)
      }
    },
    [searchDropdownOpen, pdv, productHighlight, pickProductAndFocus],
  )

  const handleCustomerSearchKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowDown' && pdv.customerResults.length > 0) {
        e.preventDefault()
        requestAnimationFrame(() => customerItemRefs.current[0]?.focus?.())
      }
    },
    [pdv.customerResults.length],
  )

  const handleCustomerItemKeyDown = useCallback(
    (e, idx, customer) => {
      const len = pdv.customerResults.length
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        pdv.selectCustomer(customer)
        return
      }
      if (e.key === 'ArrowDown' && idx < len - 1) {
        e.preventDefault()
        customerItemRefs.current[idx + 1]?.focus?.()
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (idx > 0) customerItemRefs.current[idx - 1]?.focus?.()
        else customerSearchInputRef.current?.focus?.()
      }
    },
    [pdv],
  )

  if (!pdv.selectedRegisterId) {
    return (
      <div className="pdv-page pdv-login-page">
        <div className="pdv-login-card">
          {pdv.tenantLogo ? (
            <div className="pdv-login-logo-wrap">
              <img src={pdv.tenantLogo} alt="Logo" className="pdv-login-logo" />
            </div>
          ) : (
            <Title level={3} className="pdv-login-brand-title">PDV</Title>
          )}
          <Title level={5} className="pdv-login-subtitle">Acessar caixa</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
            Selecione o caixa e digite a senha para operar.
          </Text>
          {pdv.registers.length === 0 ? (
            <Alert
              type="info"
              message="Nenhum PDV disponível"
              description="Você não está vinculado a nenhum caixa. Peça ao administrador para atribuí-lo em Pontos de Venda (sistema principal) e configurar a senha do PDV."
              showIcon
              style={{ maxWidth: 360 }}
            />
          ) : (
            <Form
              layout="vertical"
              className="pdv-login-form"
              onFinish={() => pdv.submitPdvLogin()}
            >
              {pdv.isRoot && (
                <Form.Item label="Empresa">
                  <Select
                    placeholder="Empresa"
                    options={pdv.tenants.map((t) => ({ value: t.id, label: t.name }))}
                    value={pdv.selectedTenantId}
                    onChange={pdv.setSelectedTenantId}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              )}
              <Form.Item label="Caixa" required>
                <Select
                  placeholder="Selecione o caixa"
                  options={pdv.registers.map((r) => ({ value: r.id, label: r.name }))}
                  value={pdv.loginRegisterId || undefined}
                  onChange={(id) => { pdv.setLoginRegisterId(id); pdv.setPdvPasswordValue('') }}
                  style={{ width: '100%' }}
                  allowClear={false}
                />
              </Form.Item>
              <Form.Item
                label="Senha do PDV"
                required
                extra="Obrigatória. Cada caixa possui uma senha configurada em Pontos de Venda."
              >
                <Input.Password
                  placeholder="Senha do caixa"
                  value={pdv.pdvPasswordValue}
                  onChange={(e) => pdv.setPdvPasswordValue(e.target.value)}
                  onPressEnter={() => pdv.submitPdvLogin()}
                  size="large"
                  autoComplete="current-password"
                  autoFocus={pdv.registers.length > 0}
                />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  size="large"
                  block
                  htmlType="submit"
                  loading={pdv.loadingStartSession}
                  disabled={!pdv.loginRegisterId || !pdv.pdvPasswordValue?.trim()}
                >
                  Entrar
                </Button>
              </Form.Item>
            </Form>
          )}
          <Button type="default" icon={<LogoutOutlined />} onClick={logout} className="pdv-login-logout" block>
            Sair da conta
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="pdv-page">
      <header className="pdv-header pdv-header--full-width">
        <div className="pdv-header-bar">
          <div className="pdv-header-left">
            {pdv.tenantLogo ? (
              <div className="pdv-logo-wrap">
                <img src={pdv.tenantLogo} alt="" className="pdv-logo" />
              </div>
            ) : (
              <Title level={4} className="pdv-brand-title">PDV</Title>
            )}
            {pdv.isRoot && (
              <Select
                placeholder="Empresa"
                options={pdv.tenants.map((t) => ({ value: t.id, label: t.name }))}
                value={pdv.selectedTenantId}
                onChange={pdv.setSelectedTenantId}
                className="pdv-header-tenant-select"
                aria-label="Empresa"
              />
            )}
            <span className="pdv-register-pill">{currentRegisterName || 'Caixa'}</span>
          </div>
          <div className="pdv-header-right">
            <Button
              size="small"
              icon={<LogoutOutlined />}
              onClick={pdv.endSessionAndClear}
              loading={pdv.loadingEndSession}
              className="pdv-btn-end-session"
            >
              <span className="pdv-btn-end-session-text">Encerrar sessão</span>
            </Button>
            <span className="pdv-header-user" title={user?.fullName || user?.name || 'Atendente'}>
              {user?.fullName || user?.name || 'Atendente'}
            </span>
          </div>
        </div>
        <div className="pdv-header-meta">
          <time className="pdv-header-clock" dateTime={now.toISOString()}>
            <ClockCircleOutlined aria-hidden className="pdv-header-clock-icon" />
            <span className="pdv-header-clock-text">{now.format('DD/MM/YYYY · HH:mm:ss')}</span>
          </time>
        </div>
      </header>

      <div className="pdv-main">
        <div className="pdv-mobile-hints" aria-label="Atalhos rápidos">
          <span><kbd>F2</kbd> busca</span>
          <span><kbd>F9</kbd> finalizar</span>
          <span><kbd>Alt</kbd>+<kbd>↑</kbd><kbd>↓</kbd> carrinho</span>
        </div>

        <Row
          gutter={[{ xs: 12, sm: 16, lg: 20 }, { xs: 12, sm: 16, lg: 20 }]}
          align="top"
          className="pdv-main-row"
        >
          <Col xs={{ span: 24, order: 1 }} lg={{ span: 10, xl: 8, order: 1 }} className="pdv-col-left pdv-col-checkout-flow">
            <div className="pdv-search-wrap">
              <label className="pdv-search-label" htmlFor="pdv-product-search">
                Adicionar produto
              </label>
              <Input
                id="pdv-product-search"
                ref={searchInputRef}
                placeholder="Código de barras, nome… (F2 · Enter adiciona o destacado)"
                prefix={<BarcodeOutlined className="pdv-search-prefix-icon" aria-hidden />}
                suffix={pdv.loadingProducts ? <Spin size="small" /> : null}
                value={pdv.productSearch}
                onChange={(e) => pdv.setProductSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                allowClear
                size="large"
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded={searchDropdownOpen}
                aria-controls={searchDropdownOpen ? 'pdv-product-listbox' : undefined}
                aria-activedescendant={
                  searchDropdownOpen && pdv.productResults[productHighlight]
                    ? `pdv-product-option-${productHighlight}`
                    : undefined
                }
              />
              {pdv.productSearch?.trim() && (pdv.productResults.length > 0 || pdv.loadingProducts) && (
                <div
                  id="pdv-product-listbox"
                  className="pdv-product-dropdown"
                  role="listbox"
                  aria-label="Resultados da busca"
                >
                  {pdv.loadingProducts ? (
                    <div className="pdv-dropdown-loading"><Spin size="small" /> Buscando…</div>
                  ) : (
                    <div className="pdv-dropdown-list">
                      {pdv.productResults.map((p, idx) => {
                        const price = p.discountPrice ?? p.unitPrice ?? 0
                        const active = idx === productHighlight
                        return (
                          <div
                            key={p.id}
                            id={`pdv-product-option-${idx}`}
                            role="option"
                            aria-selected={active}
                            className={`pdv-dropdown-item${active ? ' pdv-dropdown-item--active' : ''}`}
                            onMouseEnter={() => setProductHighlight(idx)}
                            onClick={() => pickProductAndFocus(p)}
                              title={`${p.name} — ${formatPrice(price)}`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                pickProductAndFocus(p)
                              }
                            }}
                            tabIndex={-1}
                          >
                            <span className="pdv-dropdown-name">{p.name}</span>
                            <span className="pdv-dropdown-price">{formatPrice(price)}</span>
                            <PlusOutlined className="pdv-dropdown-plus" aria-hidden />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <section className="pdv-customer-strip" aria-label="Cliente da venda">
              <div className="pdv-customer-strip-inner">
                <div className="pdv-customer-strip-top">
                  <div className="pdv-customer-strip-avatar" aria-hidden>
                    <UserOutlined />
                  </div>
                  <div className="pdv-customer-strip-info">
                    <span className="pdv-customer-strip-kicker">Cliente nesta venda</span>
                    <button
                      type="button"
                      className="pdv-customer-strip-name-btn"
                      onClick={pdv.openCustomerModal}
                    >
                      {pdv.customerName?.trim() ? pdv.customerName : 'Consumidor — toque para buscar ou cadastrar'}
                    </button>
                  </div>
                </div>
                <div className="pdv-customer-strip-actions">
                  <Tooltip title="Atalho F11">
                    <Button
                      type="primary"
                      icon={<UserAddOutlined />}
                      onClick={pdv.openCustomerModal}
                      className="pdv-customer-strip-action"
                    >
                      <span className="pdv-customer-strip-action-label">Cliente</span>
                      <kbd className="pdv-kbd-inline">F11</kbd>
                    </Button>
                  </Tooltip>
                </div>
              </div>
            </section>

            <Card
              title={(
                <span className="pdv-card-head-title">
                  <DollarOutlined aria-hidden /> Pagamento
                </span>
              )}
              size="small"
              className="pdv-card pdv-payment-card pdv-card-elevated"
            >
              <Form layout="vertical" size="small">
                <Form.Item label="Status da venda">
                  <Select
                    value={pdv.saleStatus}
                    onChange={pdv.setSaleStatus}
                    options={[
                      { value: 'COMPLETED', label: 'Concluída (padrão)' },
                      { value: 'OPEN', label: 'Pendente (adicionar pagamento no sistema principal)' },
                    ]}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                {pdv.saleStatus === 'OPEN' && (
                  <Alert
                    type="info"
                    showIcon
                    message="Venda pendente"
                    description="Adicione o pagamento no sistema principal (Consultar vendas → detalhe da venda → Adicionar pagamento)."
                    style={{ marginBottom: 16 }}
                  />
                )}
                {pdv.saleStatus === 'COMPLETED' && (
                <>
                <Form.Item label="Forma de pagamento">
                  <Select
                    value={pdv.paymentMethod}
                    onChange={(v) => { pdv.setPaymentMethod(v); if (v !== 'CREDIT_CARD') pdv.setInstallmentsCount(1) }}
                    options={PAYMENT_METHOD_OPTIONS_PDV}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                {(pdv.paymentMethod === 'CREDIT_CARD' || pdv.paymentMethod === 'DEBIT_CARD') && (
                  <>
                  <Form.Item label="Maquininha" required>
                    {pdv.cardMachines?.length > 0 ? (
                      <Select
                        value={pdv.selectedCardMachineId}
                        onChange={pdv.setSelectedCardMachineId}
                        options={pdv.cardMachines.map((m) => ({
                          value: m.id,
                          label: m.acquirerCnpj ? `${m.name} (CNPJ adq.)` : m.name,
                        }))}
                        placeholder="Selecione a maquininha"
                        style={{ width: '100%' }}
                      />
                    ) : (
                      <div style={{ fontSize: 12, color: '#8c8c8c', padding: '8px 0' }}>
                        Cadastre maquininhas no sistema principal.
                      </div>
                    )}
                  </Form.Item>
                  <Form.Item label="Bandeira do cartão" required>
                    <Select
                      value={pdv.cardBrand}
                      onChange={pdv.setCardBrand}
                      options={[
                        { value: '01', label: 'Visa' },
                        { value: '02', label: 'Mastercard' },
                        { value: '03', label: 'Amex' },
                        { value: '04', label: 'Sorocred' },
                        { value: '99', label: 'Outros' },
                      ]}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Form.Item label="Número da autorização" extra="Opcional. Preencha no sistema principal para NFC-e.">
                    <Input
                      value={pdv.cardAuthorization}
                      onChange={(e) => pdv.setCardAuthorization(e.target.value)}
                      placeholder="Código da transação"
                      maxLength={20}
                    />
                  </Form.Item>
                {pdv.paymentMethod === 'CREDIT_CARD' && (
                  <>
                  <Form.Item label="Parcelas">
                    <Select
                      value={Math.min(pdv.installmentsCount, pdv.effectiveMaxInstallments || 12)}
                      onChange={pdv.setInstallmentsCount}
                      options={Array.from({ length: Math.max(1, pdv.effectiveMaxInstallments || 12) }, (_, i) => i + 1).map((n) => {
                              const maxNoInterest = pdv.effectiveMaxInstallmentsNoInterest ?? 1
                              const interestPercent = Number(pdv.effectiveInterestRatePercent) || 0
                              let totalWithInterest = pdv.total
                              if (n > maxNoInterest && interestPercent > 0) {
                                const i = interestPercent / 100
                                const periodosComJuros = n - maxNoInterest
                                totalWithInterest = pdv.total * Math.pow(1 + i, periodosComJuros)
                              }
                              const valorParcela = totalWithInterest / n
                              const semJuros = n <= maxNoInterest
                              return {
                                value: n,
                                label: semJuros
                                  ? `${n}x de ${formatPrice(valorParcela)} (sem juros)`
                                  : `${n}x de ${formatPrice(valorParcela)}`,
                              }
                            })
                      }
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                {pdv.installmentsCalc && (
                  <div style={{ fontSize: 12, color: '#667085', marginTop: -8, marginBottom: 8 }}>
                    Parcela: <strong>{formatPrice(pdv.installmentsCalc.installmentValue)}</strong>
                    {' · '}
                    Total: <strong>{formatPrice(pdv.totalAPagar)}</strong>
                  </div>
                )}
                  </>
                )}
                  </>
                )}
                <Form.Item label="Valor recebido">
                  <InputNumber
                    id="pdv-amount-received"
                    ref={amountReceivedRef}
                    min={0}
                    value={pdv.amountReceived}
                    onChange={(v) => pdv.setAmountReceived(v)}
                    placeholder={formatPrice(pdv.totalAPagar ?? pdv.total)}
                    style={{ width: '100%' }}
                    prefix="R$"
                    disabled={['CREDIT_CARD', 'DEBIT_CARD', 'PIX'].includes(pdv.paymentMethod)}
                  />
                </Form.Item>
                </>
                )}
              </Form>

              <Divider style={{ margin: '12px 0' }} />

              <div className="pdv-total-row">
                <Text type="secondary">Subtotal</Text>
                <Text type="secondary">{formatPrice(pdv.subtotal)}</Text>
              </div>
              {pdv.saleDiscount > 0 && (
                <div className="pdv-total-row">
                  <Text type="secondary">Desconto</Text>
                  <Text type="secondary">- {formatPrice(pdv.saleDiscount)}</Text>
                </div>
              )}
              {pdv.deliveryFee > 0 && (
                <div className="pdv-total-row">
                  <Text type="secondary">Entrega</Text>
                  <Text type="secondary">{formatPrice(pdv.deliveryFee)}</Text>
                </div>
              )}
              {pdv.installmentsCalc && pdv.installmentsCalc.totalWithInterest > pdv.total && (
                <div className="pdv-total-row">
                  <Text type="secondary">Juros</Text>
                  <Text type="secondary">{formatPrice(pdv.installmentsCalc.totalWithInterest - pdv.total)}</Text>
                </div>
              )}
              {pdv.installmentsCalc && pdv.installmentsCalc.cardFee > 0 && (
                <div className="pdv-total-row">
                  <Text type="secondary">Taxa cartão</Text>
                  <Text type="secondary">{formatPrice(pdv.installmentsCalc.cardFee)}</Text>
                </div>
              )}
              <div className="pdv-total-row" style={{ marginTop: 8 }}>
                <Text strong>Total</Text>
                <Text strong style={{ fontSize: 18 }}>{formatPrice(pdv.totalAPagar ?? pdv.total)}</Text>
              </div>
              {pdv.amountReceived != null && pdv.amountReceived > (pdv.totalAPagar ?? pdv.total) && (
                <div className="pdv-total-row" style={{ marginTop: 8 }}>
                  <Text strong>Troco</Text>
                  <Text strong style={{ fontSize: 18, color: '#52c41a' }}>{formatPrice(pdv.amountReceived - (pdv.totalAPagar ?? pdv.total))}</Text>
                </div>
              )}

              <Button
                type="primary"
                size="large"
                block
                icon={<CheckCircleOutlined />}
                onClick={() => pdv.cart.length > 0 && !pdv.submitting && pdv.handleFinish()}
                loading={pdv.submitting}
                disabled={pdv.cart.length === 0}
                style={{ marginTop: 16 }}
              >
                {pdv.saleStatus === 'OPEN' ? 'Registrar como pendente' : 'Finalizar venda (F9)'}
              </Button>

              </Card>

            <Collapse
              bordered={false}
              className="pdv-adjustments-collapse"
              expandIconPosition="end"
              activeKey={adjustmentsActiveKey}
              onChange={(keys) => setAdjustmentsActiveKey(Array.isArray(keys) ? keys : keys ? [keys] : [])}
              items={[
                {
                  key: 'adjustments',
                  label: (
                    <span className="pdv-adjustments-collapse-label">
                      <SlidersOutlined aria-hidden />
                      Tipo de venda, desconto, entrega e NF-e
                    </span>
                  ),
                  children: (
                    <Form layout="vertical" size="small" className="pdv-adjustments-form">
                      <Form.Item label="Tipo de venda">
                        <Select value={pdv.saleType} onChange={pdv.setSaleType} options={SALE_TYPE_OPTIONS} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item
                        label="CPF/CNPJ na nota"
                        extra="Opcional. Obrigatório para algumas NF-e."
                      >
                        <Input
                          value={pdv.customerDocument || ''}
                          onChange={(e) => pdv.setCustomerDocument(maskCpfCnpjBr(e.target.value))}
                          placeholder="CPF ou CNPJ"
                          maxLength={18}
                          allowClear
                        />
                      </Form.Item>
                      <Form.Item>
                        <Checkbox checked={pdv.includeCpfOnNote} onChange={(e) => pdv.setIncludeCpfOnNote(e.target.checked)}>
                          Incluir CPF/CNPJ na nota fiscal
                        </Checkbox>
                      </Form.Item>
                      <Form.Item label="Desconto na venda">
                        <Radio.Group
                          value={pdv.discountType}
                          onChange={(e) => {
                            pdv.setDiscountType(e.target.value)
                            if (e.target.value === 'amount') pdv.setDiscountPercent(0)
                            else pdv.setDiscountAmount(0)
                          }}
                        >
                          <Radio value="amount">Valor R$</Radio>
                          <Radio value="percent">Percentual</Radio>
                        </Radio.Group>
                        {pdv.discountType === 'amount' ? (
                          <InputNumber
                            min={0}
                            value={pdv.discountAmount}
                            onChange={(v) => {
                              pdv.setDiscountAmount(v ?? 0)
                              pdv.setDiscountPercent(0)
                            }}
                            style={{ width: '100%', marginTop: 8 }}
                            prefix="R$"
                          />
                        ) : (
                          <InputNumber
                            min={0}
                            max={100}
                            value={pdv.discountPercent}
                            onChange={(v) => {
                              pdv.setDiscountPercent(v ?? 0)
                              pdv.setDiscountAmount(0)
                            }}
                            style={{ width: '100%', marginTop: 8 }}
                            addonAfter="%"
                          />
                        )}
                      </Form.Item>
                      <Form.Item label="Taxa de entrega">
                        <InputNumber
                          min={0}
                          value={pdv.deliveryFee}
                          onChange={(v) => pdv.setDeliveryFee(v ?? 0)}
                          style={{ width: '100%' }}
                          prefix="R$"
                        />
                      </Form.Item>
                      {pdv.saleType === 'DELIVERY' && (
                        <Collapse
                          size="small"
                          className="pdv-delivery-nested"
                          items={[
                            {
                              key: 'delivery',
                              label: 'Endereço e dados da entrega',
                              children: (
                                <Form layout="vertical" size="small">
                                  <Form.Item label="Endereço">
                                    <Input value={pdv.deliveryAddress} onChange={(e) => pdv.setDeliveryAddress(e.target.value)} placeholder="Rua, número" />
                                  </Form.Item>
                                  <Form.Item label="Complemento">
                                    <Input value={pdv.deliveryComplement} onChange={(e) => pdv.setDeliveryComplement(e.target.value)} placeholder="Apto, bloco…" />
                                  </Form.Item>
                                  <Row gutter={8}>
                                    <Col span={8}>
                                      <Form.Item label="CEP">
                                        <Input value={pdv.deliveryZipCode} onChange={(e) => pdv.setDeliveryZipCode(e.target.value)} placeholder="CEP" />
                                      </Form.Item>
                                    </Col>
                                    <Col span={16}>
                                      <Form.Item label="Bairro">
                                        <Input value={pdv.deliveryNeighborhood} onChange={(e) => pdv.setDeliveryNeighborhood(e.target.value)} placeholder="Bairro" />
                                      </Form.Item>
                                    </Col>
                                  </Row>
                                  <Row gutter={8}>
                                    <Col span={18}>
                                      <Form.Item label="Cidade">
                                        <Input value={pdv.deliveryCity} onChange={(e) => pdv.setDeliveryCity(e.target.value)} placeholder="Cidade" />
                                      </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                      <Form.Item label="UF">
                                        <Input value={pdv.deliveryState} onChange={(e) => pdv.setDeliveryState(e.target.value)} placeholder="UF" maxLength={2} />
                                      </Form.Item>
                                    </Col>
                                  </Row>
                                  <Form.Item label="Instruções para entrega">
                                    <Input.TextArea value={pdv.deliveryInstructions} onChange={(e) => pdv.setDeliveryInstructions(e.target.value)} placeholder="Opcional" rows={2} />
                                  </Form.Item>
                                  <Form.Item>
                                    <Checkbox checked={pdv.createDeliveryWithSale} onChange={(e) => pdv.setCreateDeliveryWithSale(e.target.checked)}>
                                      Criar entrega automaticamente após a venda
                                    </Checkbox>
                                  </Form.Item>
                                </Form>
                              ),
                            },
                          ]}
                        />
                      )}
                    </Form>
                  ),
                },
              ]}
            />

            <Card
              size="small"
              className="pdv-card pdv-card-elevated pdv-notes-card"
              style={{ marginTop: 0 }}
              title={(
                <span className="pdv-card-head-title pdv-card-head-title--muted">Observações da venda</span>
              )}
            >
              <Input.TextArea
                value={pdv.notes}
                onChange={(e) => pdv.setNotes(e.target.value)}
                placeholder="Instruções para a cozinha, observações fiscais…"
                rows={2}
                showCount
                maxLength={500}
              />
            </Card>
          </Col>

          <Col xs={{ span: 24, order: 2 }} lg={{ span: 14, xl: 16, order: 2 }} className="pdv-produtos-col pdv-col-right pdv-col-cart-sticky">
            <Card
              title={(
                <span className="pdv-card-head-title">
                  <ShoppingCartOutlined aria-hidden /> Carrinho
                  {pdv.cart.length > 0 && (
                    <span className="pdv-cart-count">{pdv.cart.length}</span>
                  )}
                </span>
              )}
              size="small"
              className="pdv-card pdv-cart-card pdv-card-elevated"
            >
              {pdv.cart.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  styles={{ image: { height: 56 } }}
                  description={(
                    <div className="pdv-empty-cart">
                      <div className="pdv-empty-cart-title">Nenhum item ainda</div>
                      <p className="pdv-empty-cart-hint">
                        Busque acima; defina o cliente na faixa logo abaixo quando precisar.
                      </p>
                    </div>
                  )}
                />
              ) : (
                <Table
                  sticky
                  scroll={{ y: cartTableScrollY, x: 'max-content' }}
                  dataSource={pdv.cart.map((c) => ({ ...c, key: c.productId }))}
                  onRow={(_, index) => ({
                    className: index === cartRowIndex ? 'pdv-cart-row--kbd-focus' : undefined,
                  })}
                  columns={[
                    { title: '#', width: 36, align: 'center', render: (_, __, i) => i + 1 },
                    {
                      title: 'Produto',
                      dataIndex: 'productName',
                      ellipsis: true,
                      render: (_, r) => {
                        const qty = r.quantity || 1
                        const lineTotal = (Number(r.unitPrice) * qty) - (Number(r.discountAmount) || 0)
                        const unit = Number(r.unitPrice) || 0
                        const discount = Number(r.discountAmount) || 0
                        return (
                          <Tooltip
                            overlayClassName="pdv-price-tooltip"
                            title={
                              <div className="pdv-price-tt-root" style={{ maxWidth: 260 }}>
                                <div className="pdv-price-tt-title">{r.productName}</div>
                                {r.productSku && <div className="pdv-price-tt-muted">SKU: {r.productSku}</div>}
                                <div className="pdv-price-tt-row">
                                  Unidade: <span className="pdv-price-tt-strong">{formatPrice(unit)}</span> · Qtd:{' '}
                                  <span className="pdv-price-tt-strong">{qty}</span>
                                </div>
                                {discount > 0 && (
                                  <div className="pdv-price-tt-row">
                                    Desconto: <span className="pdv-price-tt-strong">-{formatPrice(discount)}</span>
                                  </div>
                                )}
                                <div className="pdv-price-tt-row pdv-price-tt-row--total">
                                  Total da linha: <span className="pdv-price-tt-strong">{formatPrice(lineTotal)}</span>
                                </div>
                              </div>
                            }
                          >
                            <span className="pdv-cart-product-name">{r.productName}</span>
                          </Tooltip>
                        )
                      },
                    },
                    {
                      title: 'Qtd',
                      width: 100,
                      align: 'center',
                      render: (_, record) => (
                        <Space.Compact size="small" className="pdv-qty-compact">
                          <Button size="small" className="pdv-qty-step-btn" icon={<MinusOutlined />} onClick={() => pdv.updateCartItem(record.productId, 'quantity', Math.max(0.1, (record.quantity || 1) - 1))} />
                          <InputNumber min={0.1} step={0.1} value={record.quantity} onChange={(v) => pdv.updateCartItem(record.productId, 'quantity', v ?? 1)} size="small" controls={false} className="pdv-qty-input" />
                          <Button size="small" className="pdv-qty-step-btn" icon={<PlusOutlined />} onClick={() => pdv.updateCartItem(record.productId, 'quantity', (record.quantity || 1) + 1)} />
                        </Space.Compact>
                      ),
                    },
                    { title: 'Unit.', width: 88, align: 'right', responsive: ['md'], render: (_, r) => <span className="pdv-cart-money">{formatPrice(r.unitPrice)}</span> },
                    {
                      title: 'Total',
                      width: 118,
                      align: 'right',
                      render: (_, r) => (
                        <Text strong className="pdv-cart-money">
                          {formatPrice(r.unitPrice * (r.quantity || 1) - (r.discountAmount || 0))}
                        </Text>
                      ),
                    },
                    { title: '', width: 36, render: (_, r) => <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => pdv.removeFromCart(r.productId)} /> },
                  ]}
                  pagination={false}
                  size="small"
                  className="pdv-cart-table"
                />
              )}
              {pdv.cart.length > 0 && (
                <div className="pdv-cart-footer">
                  <Button type="link" danger onClick={() => pdv.cart.length > 0 && pdv.removeFromCart(pdv.cart[pdv.cart.length - 1].productId)}>
                    Desfazer último item <kbd className="pdv-kbd-inline">F10</kbd>
                  </Button>
                </div>
              )}
            </Card>
            <Card
              size="small"
              className="pdv-card pdv-shortcuts-card pdv-shortcuts-desktop pdv-card-elevated"
              style={{ marginTop: 16 }}
              title={(
                <span className="pdv-card-head-title pdv-card-head-title--muted">Atalhos de teclado</span>
              )}
            >
              <div className="pdv-shortcuts-grid">
                <span className="pdv-shortcut-key">F2</span>
                <span className="pdv-shortcut-desc">Busca de produto</span>
                <span className="pdv-shortcut-key">F3</span>
                <span className="pdv-shortcut-desc">Valor recebido (dinheiro)</span>
                <span className="pdv-shortcut-key">F4</span>
                <span className="pdv-shortcut-desc">Desconto / entrega / NF-e</span>
                <span className="pdv-shortcut-key">F5</span>
                <span className="pdv-shortcut-desc">PIX</span>
                <span className="pdv-shortcut-key">F6</span>
                <span className="pdv-shortcut-desc">Dinheiro</span>
                <span className="pdv-shortcut-key">F7</span>
                <span className="pdv-shortcut-desc">Débito</span>
                <span className="pdv-shortcut-key">F8</span>
                <span className="pdv-shortcut-desc">Crédito</span>
                <span className="pdv-shortcut-key">F9</span>
                <span className="pdv-shortcut-desc">Finalizar venda</span>
                <span className="pdv-shortcut-key">F10</span>
                <span className="pdv-shortcut-desc">Cancelar último item</span>
                <span className="pdv-shortcut-key">F11</span>
                <span className="pdv-shortcut-desc">Cliente</span>
                <span className="pdv-shortcut-key">Alt+↑↓</span>
                <span className="pdv-shortcut-desc">Linha do carrinho</span>
                <span className="pdv-shortcut-key">Alt+Home/End</span>
                <span className="pdv-shortcut-desc">Primeira / última linha</span>
                <span className="pdv-shortcut-key">Alt+= / Alt+-</span>
                <span className="pdv-shortcut-desc">+1 / −1 na quantidade</span>
                <span className="pdv-shortcut-key">Alt+Del</span>
                <span className="pdv-shortcut-desc">Remove linha destacada</span>
              </div>
            </Card>
          </Col>
        </Row>

        <div className="pdv-bottom-bar">
          <span className="pdv-bottom-bar-total">
            <span className="pdv-bottom-bar-label">Total</span>
            {formatPrice(pdv.totalAPagar ?? pdv.total)}
          </span>
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={() => pdv.cart.length > 0 && !pdv.submitting && pdv.handleFinish()}
            loading={pdv.submitting}
            disabled={pdv.cart.length === 0}
            aria-label={pdv.saleStatus === 'OPEN' ? 'Registrar venda pendente' : 'Finalizar venda (atalho F9)'}
          >
            {pdv.saleStatus === 'OPEN' ? 'Pendente' : 'Finalizar'}
          </Button>
        </div>
      </div>

      <Modal
        title={(
          <span className="pdv-modal-title">
            <UserOutlined aria-hidden /> Cliente
          </span>
        )}
        open={pdv.customerModalOpen}
        onCancel={pdv.closeCustomerModal}
        afterOpenChange={(open) => {
          if (open) setTimeout(() => customerSearchInputRef.current?.focus?.({ preventScroll: true }), 0)
        }}
        footer={null}
        width={440}
        wrapClassName="pdv-modal-customer"
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              ref={customerSearchInputRef}
              placeholder="Buscar (Enter) · ↓ lista"
              value={pdv.customerSearch}
              onChange={(e) => pdv.setCustomerSearch(e.target.value)}
              onPressEnter={pdv.searchCustomer}
              onKeyDown={handleCustomerSearchKeyDown}
              allowClear
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={pdv.searchCustomer} loading={pdv.loadingCustomerSearch}>Buscar</Button>
          </Space.Compact>
        </div>
        {pdv.customerResults.length > 0 ? (
          <div className="pdv-customer-list">
            {pdv.customerResults.map((c, idx) => (
              <div
                key={c.id}
                ref={(el) => {
                  customerItemRefs.current[idx] = el
                }}
                className="pdv-customer-item"
                onClick={() => pdv.selectCustomer(c)}
                onKeyDown={(e) => handleCustomerItemKeyDown(e, idx, c)}
                role="button"
                tabIndex={0}
              >
                <div>{c.name}</div>
                {(c.document || c.phone) && <Text type="secondary" style={{ fontSize: 12 }}>{[c.document, c.phone].filter(Boolean).join(' · ')}</Text>}
              </div>
            ))}
          </div>
        ) : pdv.customerSearched ? (
          <Form layout="vertical" onFinish={pdv.createCustomerAndSelect}>
            <Form.Item name="name" label="Nome" rules={[{ required: true }, { max: 255 }]}>
              <Input placeholder="Nome do cliente" />
            </Form.Item>
            <Form.Item
              name="document"
              label="CPF/CNPJ (opcional)"
              getValueFromEvent={(e) => maskCpfCnpjBr(e?.target?.value)}
            >
              <Input
                placeholder="CPF ou CNPJ"
                inputMode="numeric"
                maxLength={18}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={pdv.loadingCustomerCreate}>Cadastrar e selecionar</Button>
          </Form>
        ) : (
          <div style={{ textAlign: 'center', padding: 24 }}><Text type="secondary">Digite nome, CPF ou CNPJ para buscar.</Text></div>
        )}
      </Modal>

      <Modal
        open={pdv.successModalOpen}
        onCancel={pdv.closeSuccessModal}
        footer={null}
        width={420}
        centered
        closable={false}
        zIndex={2100}
        className="pdv-success-modal pdv-modal-success"
        styles={{ body: { padding: 0 } }}
      >
        {pdv.lastSale && (
          <div className="pdv-success-content">
            <div className="pdv-success-header">
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={pdv.closeSuccessModal}
                className="pdv-success-close"
                aria-label="Fechar"
              />
              <div className="pdv-success-icon">
                <CheckCircleOutlined />
              </div>
              <h3 className="pdv-success-title">Venda registrada!</h3>
            </div>
            <div className="pdv-success-body">
              <div className="pdv-success-number">{pdv.lastSale.saleNumber}</div>
              <div className="pdv-success-total">{formatPrice(pdv.lastSale.total)}</div>
              {pdv.lastDelivery && (
                <div className="pdv-success-delivery">
                  <CarOutlined /> Entrega {pdv.lastDelivery.deliveryNumber} criada.
                </div>
              )}
              {pdv.lastSale?.status === 'OPEN' && (
                <Alert type="info" message="Venda pendente" description="Adicione o pagamento no sistema principal para concluir." className="pdv-success-alert" showIcon />
              )}
            </div>
            <Divider style={{ margin: '16px 0' }} />
            <div className="pdv-success-actions">
              {pdv.lastSale.status !== 'OPEN' && pdv.lastSale.canEmitFiscalReceipt && <Button block icon={<FilePdfOutlined />} onClick={pdv.handleDownloadFiscal} loading={pdv.loadingFiscalReceipt}>Cupom fiscal (NFC-e)</Button>}
              {pdv.lastSale.status !== 'OPEN' && pdv.lastSale.canEmitNfe && <Button block icon={<FilePdfOutlined />} onClick={pdv.handleDownloadNfe} loading={pdv.loadingNfe}>NF-e</Button>}
              {pdv.lastSale.status !== 'OPEN' && pdv.lastSale.canEmitSimpleReceipt && <Button block icon={<FilePdfOutlined />} onClick={pdv.handleDownloadSimple} loading={pdv.loadingSimpleReceipt}>Comprovante</Button>}
              {pdv.lastDelivery && process.env.REACT_APP_FE_URL && <Button block icon={<CarOutlined />} onClick={pdv.goToDeliveries}>Ir para Entregas</Button>}
              <Button type="primary" block size="large" autoFocus onClick={pdv.closeSuccessModal} style={{ marginTop: 8 }}>
                Nova venda
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
