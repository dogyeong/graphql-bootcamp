import { v4 as uuidv4 } from 'uuid';

const Mutation = {
  createUser(parent, args, { db: { users, posts, comments } }, info) {
    const emailTaken = users.some((user) => user.email === args.data.email);

    if (emailTaken) {
      throw new Error('email taken.');
    }

    const user = {
      id: uuidv4(),
      ...args.data,
    };

    users.push(user);
    return user;
  },
  deleteUser(parent, args, { db: { users, posts, comments } }, info) {
    const userIndex = users.findIndex((user) => user.id === args.id);

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const [deletedUser] = users.splice(userIndex, 1);

    posts = posts.filter((post) => {
      const match = post.author === args.id;

      if (match) {
        comments = comments.filter((comment) => comment.post !== post.id);
      }

      return !match;
    });

    comments = comments.filter((comment) => comment.author !== args.id);

    return deletedUser;
  },
  updateUser(parent, { id, data }, { db: { users } }, info) {
    const user = users.find((user) => user.id === id);

    if (!user) {
      throw new Error('User not found');
    }

    if (typeof data.email === 'string') {
      const emailTaken = users.some((user) => user.email === data.email);

      if (emailTaken) {
        throw new Error('Email taken');
      }

      user.email = data.email;
    }

    if (typeof data.name === 'string') {
      user.name = data.name;
    }

    if (typeof data.age !== 'undefined') {
      user.age = data.age;
    }

    return user;
  },
  createPost(parent, { data }, { db: { users, posts }, pubsub }, info) {
    const userExists = users.some((user) => user.id === data.author);

    if (!userExists) {
      throw new Error('User not found');
    }

    const post = {
      id: uuidv4(),
      ...data,
    };

    posts.push(post);
    if (data.published) pubsub.publish('post', { post: { mutation: 'CREATED', data: post } });

    return post;
  },
  deletePost(parent, args, { db: { posts, comments }, pubsub }, info) {
    const postIndex = posts.findIndex((post) => post.id === args.id);

    if (postIndex === -1) {
      throw new Error('Post not found');
    }

    const [deletedPost] = posts.splice(postIndex, 1);

    comments = comments.filter((comment) => comment.post !== args.id);

    if (deletedPost.published) pubsub.publish('post', { post: { mutation: 'DELETED', data: deletedPost } });

    return deletedPost;
  },
  updatePost(parent, { id, data }, { db: { posts }, pubsub }, info) {
    const post = posts.find((post) => post.id === id);
    const originalPost = { ...post };

    if (!post) throw new Error('Post not found');

    if (typeof data.title === 'string') post.title = data.title;

    if (typeof data.body === 'string') post.body = data.body;

    if (typeof data.published === 'boolean') {
      post.published = data.published;

      if (originalPost.published && !post.published) {
        pubsub.publish('post', { post: { mutation: 'DELETED', data: post } });
      } else if (post.published) {
        pubsub.publish('post', { post: { mutation: 'CREATED', data: post } });
      }
    } else if (post.published) {
      pubsub.publish('post', { post: { mutation: 'UPDATED', data: post } });
    }

    return post;
  },
  createComment(parent, { data }, { db: { users, posts, comments }, pubsub }, info) {
    const postExists = posts.some((post) => post.id === data.post && post.published);
    const userExists = users.some((user) => user.id === data.author);

    if (!postExists || !userExists) {
      throw new Error('User or Post not found');
    }

    const comment = {
      id: uuidv4(),
      ...data,
    };

    comments.push(comment);
    pubsub.publish(`comment ${data.post}`, { comment: { muation: 'CREATED', data: comment } });

    return comment;
  },
  deleteComment(parent, args, { db: { comments }, pubsub }, info) {
    const commentIndex = comments.findIndex((comment) => comment.id === args.id);

    if (commentIndex === -1) {
      throw new Error('Comment not found');
    }

    const [deletedComment] = comments.splice(commentIndex, 1);
    pubsub.publish(`comment ${deletedComment.post}`, { comment: { mutation: 'DELETED', data: deletedComment } });

    return deletedComment;
  },
  updateComment(parent, { id, data }, { db: { comments }, pubsub }, info) {
    const comment = comments.find((comment) => comment.id === id);

    if (!comment) throw new Error('Comment not found');

    if (typeof data.text === 'string') comment.text = data.text;

    pubsub.publish(`comment ${comment.post}`, { comment: { mutation: 'UPDATED', data: comment } });

    return comment;
  },
};

export default Mutation;
