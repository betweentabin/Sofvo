import { supabase } from '../lib/supabase';

class NotificationHelper {
  // メッセージ通知を送信
  async sendMessageNotification(recipientUserId, message, senderName) {
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: recipientUserId,
          title: `${senderName}からメッセージ`,
          body: this.truncateMessage(message.content),
          type: 'message',
          data: {
            conversationId: message.conversation_id,
            messageId: message.id,
            senderName: senderName
          }
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to send message notification:', error);
      return null;
    }
  }

  // 大会通知を送信
  async sendTournamentNotification(recipientUserId, tournament, notificationType) {
    const titles = {
      'registration_open': '大会参加受付開始',
      'registration_closing': '大会参加締切間近',
      'tournament_start': '大会開始のお知らせ',
      'result_published': '大会結果発表',
      'tournament_update': '大会情報更新'
    };

    const bodies = {
      'registration_open': `「${tournament.name}」の参加受付が開始されました`,
      'registration_closing': `「${tournament.name}」の参加締切が迫っています`,
      'tournament_start': `「${tournament.name}」が間もなく開始されます`,
      'result_published': `「${tournament.name}」の結果が発表されました`,
      'tournament_update': `「${tournament.name}」の情報が更新されました`
    };

    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: recipientUserId,
          title: titles[notificationType] || '大会のお知らせ',
          body: bodies[notificationType] || `${tournament.name}に関するお知らせ`,
          type: 'tournament',
          data: {
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            notificationType: notificationType
          }
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to send tournament notification:', error);
      return null;
    }
  }

  // チーム招待通知を送信
  async sendTeamInviteNotification(recipientUserId, team, inviterName) {
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: recipientUserId,
          title: 'チーム招待',
          body: `${inviterName}さんから「${team.name}」への招待が届いています`,
          type: 'team_invite',
          data: {
            teamId: team.id,
            teamName: team.name,
            inviterName: inviterName
          }
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to send team invite notification:', error);
      return null;
    }
  }

  // お知らせ通知を送信
  async sendNewsNotification(recipientUserId, news) {
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: recipientUserId,
          title: news.title || 'Sofvoからのお知らせ',
          body: this.truncateMessage(news.content),
          type: 'news',
          data: {
            newsId: news.id,
            category: news.category
          }
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to send news notification:', error);
      return null;
    }
  }

  // 複数ユーザーへの一括送信
  async sendBulkNotifications(userIds, notification) {
    const results = await Promise.all(
      userIds.map(userId => 
        this.sendCustomNotification(userId, notification)
      )
    );

    return {
      success: results.filter(r => r?.success).length,
      failed: results.filter(r => !r?.success).length,
      total: userIds.length
    };
  }

  // カスタム通知を送信
  async sendCustomNotification(recipientUserId, { title, body, type = 'general', data = {} }) {
    try {
      const { data: result, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: recipientUserId,
          title,
          body,
          type,
          data
        }
      });

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Failed to send custom notification:', error);
      return null;
    }
  }

  // メッセージを切り詰める
  truncateMessage(message, maxLength = 100) {
    if (!message) return '';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  }

  // 通知履歴を取得
  async getNotificationHistory(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get notification history:', error);
      return [];
    }
  }

  // 未読通知数を取得
  async getUnreadCount(userId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  // 通知を既読にする
  async markAsRead(notificationId, userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to mark as read:', error);
      return false;
    }
  }

  // 全通知を既読にする
  async markAllAsRead(userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      return false;
    }
  }
}

// シングルトンインスタンスをエクスポート
const notificationHelper = new NotificationHelper();
export default notificationHelper;