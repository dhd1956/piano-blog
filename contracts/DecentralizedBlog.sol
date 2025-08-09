// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DecentralizedBlog {
    // Structure to define a blog post
    struct BlogPost {
        uint256 id;             // Unique ID for the post
        address author;         // Address of the post author
        string title;           // Title of the blog post
        string ipfsHash;        // IPFS hash pointing to the post content (e.g., Markdown file)
        uint256 timestamp;      // Timestamp when the post was published
        bool exists;            // Flag to check if the post exists (useful for deletion/retrieval)
    }

    // Counter for unique blog post IDs
    uint256 public nextPostId;

    // Mapping from post ID to BlogPost struct
    mapping(uint256 => BlogPost) public posts;

    // Event emitted when a new post is published
    event PostPublished(
        uint256 indexed id,
        address indexed author,
        string title,
        string ipfsHash,
        uint256 timestamp
    );

    /**
     * @dev Publishes a new blog post.
     * @param _title The title of the blog post.
     * @param _ipfsHash The IPFS hash where the blog post content is stored.
     * This hash should point to a file (e.g., a Markdown file).
     */
    function publishPost(string memory _title, string memory _ipfsHash) public {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");

        uint256 postId = nextPostId;
        posts[postId] = BlogPost({
            id: postId,
            author: msg.sender,
            title: _title,
            ipfsHash: _ipfsHash,
            timestamp: block.timestamp,
            exists: true
        });

        emit PostPublished(postId, msg.sender, _title, _ipfsHash, block.timestamp);

        nextPostId++; // Increment for the next post
    }

    /**
     * @dev Retrieves a specific blog post by its ID.
     * @param _id The ID of the post to retrieve.
     * @return The BlogPost struct containing post details.
     */
    function getPost(uint256 _id) public view returns (
        uint256,
        address,
        string memory,
        string memory,
        uint256,
        bool
    ) {
        require(posts[_id].exists, "Post does not exist");
        BlogPost storage post = posts[_id];
        return (
            post.id,
            post.author,
            post.title,
            post.ipfsHash,
            post.timestamp,
            post.exists
        );
    }

    /**
     * @dev Retrieves the total number of posts published.
     * @return The current value of nextPostId, which represents the total count of posts.
     */
    function getTotalPosts() public view returns (uint256) {
        return nextPostId;
    }
}
