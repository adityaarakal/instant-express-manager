import mongoose from 'mongoose'

let isConnected = false

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-manager'
    
    // Disable buffering to prevent timeout errors
    mongoose.set('bufferCommands', false)
    mongoose.set('bufferMaxEntries', 0)
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    })
    
    isConnected = true
    console.log('✅ MongoDB connected successfully')
  } catch (error: any) {
    isConnected = false
    console.warn('⚠️  MongoDB connection failed:', error.message)
    console.warn('📝 Continuing without database. Some features may not work.')
    console.warn('💡 To enable database, set MONGODB_URI in .env file or start MongoDB locally')
    // Don't exit - allow app to run without database
  }
}

export const isDatabaseConnected = (): boolean => {
  return isConnected && mongoose.connection.readyState === 1
}

// Handle connection events
mongoose.connection.on('disconnected', () => {
  isConnected = false
  console.log('⚠️  MongoDB disconnected')
})

mongoose.connection.on('error', (error) => {
  isConnected = false
  console.error('❌ MongoDB error:', error)
})

mongoose.connection.on('connected', () => {
  isConnected = true
  console.log('✅ MongoDB connected')
})

mongoose.connection.on('reconnected', () => {
  isConnected = true
  console.log('✅ MongoDB reconnected')
})
