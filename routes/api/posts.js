const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

// Load Post model
const Post = require('../../models/Post');

// Load Post model
const Profile = require('../../models/Profile');

// Load Input Validation
const validatePostnput = require('../../validation/post');


// @route GET api/posts/test
// @desc Tests post routes
// @access Public
router.get('/test',(req,res) => res.json({msg:"Posts work"}));



// @route POST api/posts
// @desc Create post
// @access Private
router.post('/',passport.authenticate('jwt', { session: false }),

   (req, res) => {
       
     const { errors, isValid } = validatePostnput(req.body)
     
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }

      const newPost = new Post({
          text:req.body.text,
          name:req.body.name,
          avatar: req.body.avatar,
          user: req.user.id
      });
      
      newPost.save().then(post => res.json(post));
  });
  


// @route GET api/posts
// @desc Get all user  posts
// @access Public

router.get('/',(req,res)=> {
  const errors = {};
  
  Post.find()
  .sort({date:-1})
  .then(posts => res.json(posts))
  .catch(err => res.status(404).json({noPostsFound:'No posts found'}));
  
});

// @route GET api/posts/:id
// @desc View post
// @access Public
router.get('/:id',(req,res)=> {
  
  Post.findById(req.params.id)
  .then(post => res.json(post))
  .catch(err => res.status(404).json({noPostFound:'No post found with that id'}));
});

// @route   DELETE api/posts/:id
// @desc    Delete post
// @access  Private
router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          // Check for post owner
          if (post.user.toString() !== req.user.id) {
            return res
              .status(401)
              .json({ notauthorized: 'User not authorized' });
          }

          // Delete
          post.remove().then(() => res.json({ success: true }));
        })
        .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
    });
  }
);

// @route   post api/posts/like/:id
// @desc    LIke post
// @access  Private
router.post(
  '/like/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if(post.likes.filter(like =>like.user.toString() === req.user.id).length > 0){
            return res.json({alreadyLiked:"User already liked this post"})
          }
          
          // Add user id to likes array
          post.likes.unshift({user: req.user.id});
          
          post.save().then(post => res.json(post))
        })
        .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
    });
  }
);

// @route   post api/posts/like/:id
// @desc    LIke post
// @access  Private
router.post(
  '/unlike/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if(post.likes.filter(like =>like.user.toString() === req.user.id).length ===  0){
            return res.json({notLiked:"You have not liked this post yet"})
          }
          
          // Get the removed index
          const removeIndex = post.likes
          .map(item => item.user.toString())
          .indexOf(req.user.id);
          
          // Splice out of array user
          post.likes.splice(removeIndex,1);
          
          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
    });
  }
);

// @route   POST api/posts/comment/:id
// @desc    Add comment to post
// @access  Private
router.post(
  '/comment/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    // Check Validation
    if (!isValid) {
      // If any errors, send 400 with errors object
      return res.status(400).json(errors);
    }

    Post.findById(req.params.id)
      .then(post => {
        const newComment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user.id
        };

        // Add to comments array
        post.comments.unshift(newComment);

        // Save
        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
  }
);

// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Remove comment from post
// @access  Private
router.delete(
  '/comment/:id/:comment_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Post.findById(req.params.id)
      .then(post => {
        // Check to see if comment exists
        if (
          post.comments.filter(
            comment => comment._id.toString() === req.params.comment_id
          ).length === 0
        ) {
          return res
            .status(404)
            .json({ commentnotexists: 'Comment does not exist' });
        }

        // Get remove index
        const removeIndex = post.comments
          .map(item => item._id.toString())
          .indexOf(req.params.comment_id);

        // Splice comment out of array
        post.comments.splice(removeIndex, 1);

        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
  }
);

module.exports = router;
