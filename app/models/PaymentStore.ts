import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { paymentService, PaymentProvider } from "../services/PaymentService"

const PaymentModel = types.model("Payment").props({
  id: types.identifier,
  amount: types.number,
  currency: types.string,
  phoneNumber: types.string,
  provider: types.enumeration(["MTN", "AIRTEL"]),
  status: types.enumeration(["PENDING", "COMPLETED", "FAILED"]),
  description: types.string,
  transactionId: types.maybe(types.string),
  error: types.maybe(types.string),
  timestamp: types.Date
})

export const PaymentStoreModel = types
  .model("PaymentStore")
  .props({
    payments: types.array(PaymentModel),
    isProcessing: types.optional(types.boolean, false),
    currentPayment: types.maybe(types.reference(PaymentModel))
  })
  .views((self) => ({
    getPaymentById(id: string) {
      return self.payments.find((payment) => payment.id === id)
    },
    get pendingPayments() {
      return self.payments.filter((payment) => payment.status === "PENDING")
    },
    get completedPayments() {
      return self.payments.filter((payment) => payment.status === "COMPLETED")
    },
    get failedPayments() {
      return self.payments.filter((payment) => payment.status === "FAILED")
    }
  }))
  .actions((self) => {
    const setProcessing = (processing: boolean) => {
      self.isProcessing = processing
    }

    const setCurrentPayment = (payment: Instance<typeof PaymentModel> | undefined) => {
      self.currentPayment = payment
    }

    const addPayment = (payment: Instance<typeof PaymentModel>) => {
      self.payments.push(payment)
    }

    const updatePaymentStatus = (
      id: string,
      status: "PENDING" | "COMPLETED" | "FAILED",
      error?: string
    ) => {
      const payment = self.getPaymentById(id)
      if (payment) {
        payment.status = status
        if (error) payment.error = error
      }
    }

    const initiatePayment = async (
      amount: number,
      phoneNumber: string,
      provider: PaymentProvider,
      description: string
    ) => {
      setProcessing(true)
      try {
        // Validate phone number
        if (!paymentService.validatePhoneNumber(phoneNumber, provider)) {
          throw new Error("Invalid phone number for selected provider")
        }

        // Format phone number
        const formattedPhone = paymentService.formatPhoneNumber(phoneNumber)

        // Create payment record
        const payment = PaymentModel.create({
          id: String(Date.now()),
          amount,
          currency: "UGX",
          phoneNumber: formattedPhone,
          provider,
          status: "PENDING",
          description,
          timestamp: new Date()
        })

        // Add to store
        addPayment(payment)
        setCurrentPayment(payment)

        // Initiate payment with provider
        const result = await paymentService.initiatePayment({
          amount,
          phoneNumber: formattedPhone,
          currency: "UGX",
          description,
          provider,
          referenceId: payment.id
        })

        if (result.success) {
          payment.transactionId = result.transactionId
          // Start polling for status
          pollPaymentStatus(payment.id, result.transactionId!)
        } else {
          updatePaymentStatus(payment.id, "FAILED", result.error)
        }

        return result
      } catch (error) {
        console.error("Payment initiation error:", error)
        throw error
      } finally {
        setProcessing(false)
      }
    }

    const pollPaymentStatus = async (paymentId: string, transactionId: string) => {
      try {
        const payment = self.getPaymentById(paymentId)
        if (!payment) return

        const maxAttempts = 10
        const pollInterval = 5000 // 5 seconds
        let attempts = 0

        const checkStatus = async () => {
          if (attempts >= maxAttempts) {
            updatePaymentStatus(
              paymentId,
              "FAILED",
              "Payment verification timeout"
            )
            return
          }

          try {
            const status = await paymentService.checkTransactionStatus(
              transactionId,
              payment.provider as PaymentProvider
            )

            if (status.status === "COMPLETED") {
              updatePaymentStatus(paymentId, "COMPLETED")
              return
            }

            if (status.status === "FAILED") {
              updatePaymentStatus(paymentId, "FAILED", status.message)
              return
            }

            // Still pending, continue polling
            attempts++
            setTimeout(checkStatus, pollInterval)
          } catch (error) {
            console.error("Error checking payment status:", error)
            attempts++
            setTimeout(checkStatus, pollInterval)
          }
        }

        // Start polling
        checkStatus()
      } catch (error) {
        console.error("Error in payment status polling:", error)
        updatePaymentStatus(
          paymentId,
          "FAILED",
          "Failed to verify payment status"
        )
      }
    }

    const reset = () => {
      self.payments.clear()
      self.isProcessing = false
      self.currentPayment = undefined
    }

    return {
      setProcessing,
      setCurrentPayment,
      addPayment,
      updatePaymentStatus,
      initiatePayment,
      pollPaymentStatus,
      reset
    }
  })

export interface PaymentStore extends Instance<typeof PaymentStoreModel> {}
export interface PaymentStoreSnapshot extends SnapshotOut<typeof PaymentStoreModel> {} 