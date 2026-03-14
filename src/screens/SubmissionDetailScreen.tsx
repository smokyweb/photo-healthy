import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius, shadows } from '../theme';

const SubmissionDetailScreen = ({ route }: any) => {
  const { id } = route.params;
  const { user } = useAuth();
  const [submission, setSubmission] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [sData, cData] = await Promise.all([
        api.getSubmission(id),
        api.getComments(id),
      ]);
      setSubmission(sData.submission);
      setComments(cData.comments || []);
    } catch {} finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleComment = async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      await api.createComment(id, newComment.trim());
      setNewComment('');
      const cData = await api.getComments(id);
      setComments(cData.comments || []);
    } catch {} finally { setPosting(false); }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await api.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch {}
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (!submission) return <View style={styles.center}><Text>Submission not found</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.inner}>
        <Image source={{ uri: submission.photo1_url }} style={styles.mainPhoto} />
        {submission.photo2_url && (
          <Image source={{ uri: submission.photo2_url }} style={styles.secondPhoto} />
        )}
        <Text style={styles.title}>{submission.title}</Text>
        <Text style={styles.author}>by {submission.user_name || 'Unknown'}</Text>
        {submission.description ? <Text style={styles.description}>{submission.description}</Text> : null}

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Comments ({comments.length})</Text>

        {comments.map(comment => (
          <View key={comment.id} style={styles.commentCard}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentAuthor}>{comment.user_name || 'Unknown'}</Text>
              <Text style={styles.commentDate}>{new Date(comment.created_at).toLocaleDateString()}</Text>
              {(user?.is_admin || user?.id === comment.user_id) && (
                <TouchableOpacity onPress={() => handleDeleteComment(comment.id)}>
                  <Text style={styles.deleteBtn}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.commentText}>{comment.text}</Text>
          </View>
        ))}

        <View style={styles.commentInput}>
          <TextInput
            style={styles.input} placeholder="Add a comment..."
            placeholderTextColor={colors.gray[400]} value={newComment}
            onChangeText={setNewComment} multiline
          />
          <TouchableOpacity style={styles.postBtn} onPress={handleComment} disabled={posting}>
            {posting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.postBtnText}>Post</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primaryBg },
  content: { padding: spacing.md },
  inner: { maxWidth: 600, width: '100%', alignSelf: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mainPhoto: { width: '100%', height: 300, borderRadius: borderRadius.lg, backgroundColor: colors.gray[100], marginBottom: spacing.sm },
  secondPhoto: { width: '100%', height: 200, borderRadius: borderRadius.lg, backgroundColor: colors.gray[100], marginBottom: spacing.md },
  title: { fontSize: 22, fontWeight: '700', color: colors.black },
  author: { fontSize: 14, color: colors.gray[500], marginTop: 2, marginBottom: spacing.sm },
  description: { fontSize: 15, color: colors.gray[600], lineHeight: 22 },
  divider: { height: 1, backgroundColor: colors.gray[200], marginVertical: spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.black, marginBottom: spacing.md },
  commentCard: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  commentAuthor: { fontSize: 14, fontWeight: '600', color: colors.black, flex: 1 },
  commentDate: { fontSize: 12, color: colors.gray[400], marginRight: spacing.sm },
  deleteBtn: { fontSize: 12, color: colors.error },
  commentText: { fontSize: 14, color: colors.gray[700], lineHeight: 20 },
  commentInput: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.md, gap: spacing.sm },
  input: {
    flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[200],
    borderRadius: borderRadius.md, padding: spacing.md, fontSize: 15, color: colors.black, minHeight: 44,
  },
  postBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  postBtnText: { color: colors.white, fontWeight: '600' },
});

export default SubmissionDetailScreen;
