import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  userId: string
  title: string
  body: string
  data?: Record<string, any>
  type?: 'message' | 'tournament' | 'team_invite' | 'news'
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY')

    if (!fcmServerKey) {
      throw new Error('FCM_SERVER_KEY is not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const payload: NotificationPayload = await req.json()
    const { userId, title, body, data, type } = payload

    // Get user's active device tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('device_tokens')
      .select('token, platform')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (tokenError) {
      throw tokenError
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No active device tokens found for user' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Check user's notification settings
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Check if notification type is enabled
    if (settings) {
      if (!settings.enabled) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'User has disabled notifications' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      }

      // Check specific notification type settings
      if (type === 'message' && !settings.messages) return new Response(JSON.stringify({ success: false, message: 'Message notifications disabled' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      if (type === 'tournament' && !settings.tournaments) return new Response(JSON.stringify({ success: false, message: 'Tournament notifications disabled' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      if (type === 'team_invite' && !settings.team_invites) return new Response(JSON.stringify({ success: false, message: 'Team invite notifications disabled' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      if (type === 'news' && !settings.news) return new Response(JSON.stringify({ success: false, message: 'News notifications disabled' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Send notification to each device token
    const results = await Promise.all(
      tokens.map(async (device) => {
        const message = {
          to: device.token,
          notification: {
            title,
            body,
            sound: 'default',
            badge: 1,
          },
          data: {
            ...data,
            type: type || 'general',
          },
          priority: 'high',
        }

        // Platform-specific settings
        if (device.platform === 'ios') {
          message.notification.sound = 'default'
          message.apns = {
            payload: {
              aps: {
                'content-available': 1,
              },
            },
          }
        } else if (device.platform === 'android') {
          message.android = {
            channelId: 'sofvo_default',
            sound: 'default',
            priority: 'high',
          }
        }

        try {
          const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `key=${fcmServerKey}`,
            },
            body: JSON.stringify(message),
          })

          const result = await response.json()

          // Handle invalid tokens
          if (result.failure === 1 && result.results?.[0]?.error === 'InvalidRegistration') {
            // Mark token as inactive
            await supabase
              .from('device_tokens')
              .update({ is_active: false })
              .eq('token', device.token)
          }

          return {
            token: device.token,
            success: result.success === 1,
            error: result.results?.[0]?.error,
          }
        } catch (error) {
          console.error('Error sending to FCM:', error)
          return {
            token: device.token,
            success: false,
            error: error.message,
          }
        }
      })
    )

    // Save notification to database
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: type || 'general',
        title,
        message: body,
        data,
        read: false,
      })

    if (notifError) {
      console.error('Failed to save notification to database:', notifError)
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent to ${successCount} devices, failed for ${failureCount} devices`,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in send-push-notification function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})