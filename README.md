# [RepertoryGridTool](http://dvangennip.github.io/repertory-grid-tool/)

Repertory Grid Tool is a web form that allows you to administer repertory grid interviews.

[Try it here!](http://dvangennip.github.io/repertory-grid-tool/)

Following Kelly's (1955) [personal construct theory](http://en.wikipedia.org/wiki/Personal_construct_theory), the [repertory grid technique](http://en.wikipedia.org/wiki/Repertory_grid) assumes people construe their view of the world in their own terms. A repertory grid is one way of getting to these constructs by using a set of elements and asking people how they differtiate these elements from each other.

This web tool can be used during an interview to note the contrasting terms and rate each element using these terms as opposites on a scale. The advantage over using a paper form is the ease of generating a randomised grid for each interview. During the interview, rating of each element on their own scale is simplified (without typical confusion over the direction of the scale).

After loading the webpage, it works as follows:

1. Adjust the settings to match your desired grid and procedure.
2. Do the interview, while entering labels and ratings in this web form.
3. Data is automatically saved between sessions. Copy the data output elsewhere for permanent storage.

## Saving data

The webpage saves the data automatically upon changes.

Data is only saved within the browser's own storage, not on any remote server. You may have heard of browser cookies stored on your computer. Well, this is something similar, but it can store much more data and no one else can access it. It's like your private cookie jar.

However, if you would clean up the browser or use a private window (which trashes all data on closing), you would loose the content. So while the saving mechanism works well to keep data save across browsing sessions and prevents against data loss due to a crash, it's not save for permanent storage.

No mechanism is implemented for exporting and saving data. Just select all content and copy it to your favourite text editor. Using a `.csv` extension works best for importing the data into analysis software.

## Browser compatibility

The webpage has been tested to work with the following browsers:

* Firefox 37+
* Google Chrome 41+
* Safari 8+ (has some layout issues)

## License

No specific license has been chosen, but feel free to use the code as you see fit. It would be nice to learn of interesting uses.
