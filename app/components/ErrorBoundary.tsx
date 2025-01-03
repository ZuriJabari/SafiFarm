import React from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native"
import { designSystem as ds } from "../theme/design-system"
import * as Updates from "expo-updates"

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Log error to your error reporting service
    this.logError(error, errorInfo)
  }

  private async logError(error: Error, errorInfo: React.ErrorInfo) {
    try {
      // TODO: Implement error logging to your service
      console.error("Error caught by boundary:", error, errorInfo)
    } catch (loggingError) {
      console.error("Failed to log error:", loggingError)
    }
  }

  private async handleReload() {
    try {
      if (__DEV__) {
        // In development, just reset the state
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
        })
      } else {
        // In production, try to download and reload the latest update
        await Updates.checkForUpdateAsync()
        await Updates.fetchUpdateAsync()
        await Updates.reloadAsync()
      }
    } catch (error) {
      // If update fails, reset the state and try to continue
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      })
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.message}>
              We're sorry, but something unexpected happened. Please try again.
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => this.handleReload()}
            >
              <Text style={styles.buttonText}>Reload App</Text>
            </TouchableOpacity>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Information:</Text>
                <Text style={styles.debugText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.debugText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      )
    }

    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: ds.spacing.lg,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  title: {
    fontSize: ds.typography.sizes.xl,
    fontFamily: ds.typography.families.primaryBold,
    color: ds.colors.text,
    marginBottom: ds.spacing.md,
    textAlign: "center",
  },
  message: {
    fontSize: ds.typography.sizes.md,
    fontFamily: ds.typography.families.primary,
    color: ds.colors.textDim,
    marginBottom: ds.spacing.xl,
    textAlign: "center",
    lineHeight: 22,
  },
  button: {
    backgroundColor: ds.colors.primary500,
    paddingHorizontal: ds.spacing.xl,
    paddingVertical: ds.spacing.md,
    borderRadius: ds.layout.borderRadius.md,
    marginBottom: ds.spacing.xl,
  },
  buttonText: {
    color: ds.colors.neutral100,
    fontSize: ds.typography.sizes.md,
    fontFamily: ds.typography.families.primaryBold,
  },
  debugContainer: {
    maxHeight: 200,
    width: "100%",
    backgroundColor: ds.colors.neutral900,
    borderRadius: ds.layout.borderRadius.md,
    padding: ds.spacing.md,
    marginTop: ds.spacing.lg,
  },
  debugTitle: {
    color: ds.colors.neutral100,
    fontSize: ds.typography.sizes.sm,
    fontFamily: ds.typography.families.primaryBold,
    marginBottom: ds.spacing.sm,
  },
  debugText: {
    color: ds.colors.neutral300,
    fontSize: ds.typography.sizes.xs,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
    }),
  },
})
