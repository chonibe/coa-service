(() => {
  const app = {
    init() {
      this.container = document.getElementById('coa-dashboard-app')
      this.loadOrders()
    },

    async loadOrders() {
      try {
        // Get the customer ID from Shopify's customer object
        const customerId = window.Shopify?.customer?.id
        if (!customerId) {
          throw new Error('Customer not logged in')
        }

        const response = await fetch('/api/customer/orders', {
          headers: {
            'X-Customer-ID': customerId
          }
        })
        
        if (!response.ok) throw new Error('Failed to fetch orders')
        
        const data = await response.json()
        this.renderOrders(data.orders)
      } catch (error) {
        console.error('Error loading orders:', error)
        this.renderError(error.message)
      }
    },

    getNfcStatus(lineItem) {
      if (lineItem.nfc_tag_id && lineItem.nfc_claimed_at) {
        return { status: 'paired', label: 'Paired', className: 'paired' }
      }
      if (lineItem.nfc_tag_id) {
        return { status: 'unclaimed', label: 'Unclaimed', className: 'unclaimed' }
      }
      return { status: 'unpaired', label: 'Unpaired', className: 'unpaired' }
    },

    renderOrders(orders) {
      if (!orders || orders.length === 0) {
        this.container.innerHTML = `
          <div class="empty-state">
            <p>You haven't placed any orders yet</p>
            <a href="/collections/all" class="action-button outline">
              Start Shopping
            </a>
          </div>
        `
        return
      }

      const ordersHtml = orders.map(order => `
        <div class="order-card">
          <div class="order-header">
            <div>
              <h2 class="order-title">Order ${order.name}</h2>
              <p class="order-date">Placed on ${new Date(order.created_at).toLocaleDateString()}</p>
              <p class="order-total">Total: ${this.formatMoney(order.total_price)}</p>
            </div>
            <div class="order-status">
              <span class="status-badge ${order.financial_status}">
                ${order.financial_status.charAt(0).toUpperCase() + order.financial_status.slice(1)}
              </span>
            </div>
          </div>

          <div class="line-items">
            ${order.line_items.map(item => {
              const nfcStatus = this.getNfcStatus(item)
              return `
                <div class="line-item">
                  <div class="line-item-info">
                    ${item.image_url ? `
                      <div class="line-item-image">
                        <img src="${item.image_url}" alt="${item.title}">
                      </div>
                    ` : ''}
                    <div class="line-item-details">
                      <h3>${item.title}</h3>
                      <p>Quantity: ${item.quantity}</p>
                      <p>Price: ${this.formatMoney(item.price)}</p>
                      ${item.edition_number ? `
                        <p class="edition-info">
                          Edition ${item.edition_number} of ${item.edition_total}
                        </p>
                      ` : ''}
                    </div>
                  </div>

                  <div class="line-item-actions">
                    <span class="nfc-badge ${nfcStatus.className}">${nfcStatus.label}</span>
                    ${nfcStatus.status === 'unpaired' ? `
                      <a href="/pages/authenticate?lineItemId=${item.line_item_id}" class="action-button outline">
                        Pair NFC Tag
                      </a>
                    ` : nfcStatus.status === 'paired' && item.certificate_url ? `
                      <a href="${item.certificate_url}" class="action-button outline">
                        View Certificate
                      </a>
                    ` : ''}
                  </div>
                </div>
              `
            }).join('')}
          </div>
        </div>
      `).join('')

      this.container.innerHTML = ordersHtml
    },

    renderError(message) {
      this.container.innerHTML = `
        <div class="error-state">
          <p>${message}</p>
          <button onclick="window.location.reload()" class="action-button outline">
            Try Again
          </button>
        </div>
      `
    },

    formatMoney(amount) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount / 100)
    }
  }

  // Initialize the app when the DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init())
  } else {
    app.init()
  }
})() 